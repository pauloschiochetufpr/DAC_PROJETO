package com.dac.auth.controller;

// DTOs
import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.request.RefreshRequestDTO;
import com.dac.auth.dto.response.ErrorResponseDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
import com.dac.auth.dto.response.LogoutResponseDTO;
import com.dac.auth.dto.response.RefreshResponseDTO;
// entidades
import com.dac.auth.entity.Session;
import com.dac.auth.entity.Usuario;
// repositórios
import com.dac.auth.repository.UsuarioRepository;
// services
import com.dac.auth.service.AuthService;
import com.dac.auth.service.JwtService;
import com.dac.auth.service.RefreshTokenService;
// util
import com.dac.auth.util.DevLog;
// nimbus-jose-jwt
import com.nimbusds.jwt.JWTClaimsSet;
// jakarta
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
// Spring
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // login | autentica credenciais, emite access token JWE e seta cookie HttpOnly de refresh
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequestDTO request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) 
    {
        DevLog.log("Requisição de login recebida - email: " + request.getEmail() + ", deviceId: " + request.getDeviceId());

        if (request.getEmail() == null || request.getEmail().isBlank() ||
            request.getPassword() == null || request.getPassword().isBlank() ||
            request.getDeviceId() == null || request.getDeviceId().isBlank() ||
            request.getDeviceName() == null || request.getDeviceName().isBlank()) 
        {
            DevLog.log("Login rejeitado - campo obrigatorio ausente: email=" + request.getEmail() + ", deviceId=" + request.getDeviceId());
            return ResponseEntity.badRequest().body(new ErrorResponseDTO(400, "Campos obrigatórios ausentes ou em branco"));
        }
        
        // gateway injeta X-Forwarded-For via xfwd:true; fallback para remoteAddr em dev local
        // X-Forwarded-For pode ter formato "client, proxy1, proxy2" - o IP real é sempre o primeiro
        String xForwardedFor = httpRequest.getHeader("X-Forwarded-For");
        String ip;
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            ip = xForwardedFor.split(",")[0].trim();
        } else {
            ip = httpRequest.getRemoteAddr();
        }

        AuthService.LoginResult result = authService.login(request, ip);

        // SameSite=Strict via header manual | API Cookie do Jakarta não expõe setSameSite()
        httpResponse.addHeader("Set-Cookie",
            String.format("refreshToken=%s; Path=/; HttpOnly; Secure; Max-Age=%d; SameSite=Strict",
                result.refreshId(), 12 * 60 * 60));

        DevLog.log("Login OK - email: " + request.getEmail() + ", tipo: " + result.response().getTipo());
        return ResponseEntity.ok(result.response());
    }

    // refresh | valida cookie de refresh, rotaciona sessão e emite novo access token JWE
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @RequestBody RefreshRequestDTO request,
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) throws Exception {

        DevLog.log("Requisição de refresh recebida - deviceId: " + request.getDeviceId());

        if (refreshToken == null) {
            DevLog.log("Refresh rejeitado - cookie refreshToken ausente");
            return ResponseEntity.status(401).body(new ErrorResponseDTO(401, "Cookie de refresh ausente"));
        }

        if (request.getDeviceId() == null || request.getDeviceId().isBlank()) {
            DevLog.log("Refresh rejeitado - deviceId ausente ou em branco");
            return ResponseEntity.badRequest().body(new ErrorResponseDTO(400, "deviceId é obrigatório"));
        }

        // mesmo tratamento do login: primeiro IP da cadeia X-Forwarded-For é o cliente real
        String xForwardedFor = httpRequest.getHeader("X-Forwarded-For");
        String ip;
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            ip = xForwardedFor.split(",")[0].trim();
        } else {
            ip = httpRequest.getRemoteAddr();
        }
        Session newSession = refreshTokenService.rotateSession(refreshToken, request.getDeviceId(), ip);

        // userId null indica inconsistência no banco; não deve ocorrer em fluxo normal
        String userId = newSession.getUserId();
        if (userId == null) {
            DevLog.log("Refresh falhou - sessão retornou sem userId (inconsistencia no banco)");
            throw new RuntimeException("Sessão sem userId");
        }

        Usuario usuario = usuarioRepository.findByCpf(userId)
            .orElseThrow(() -> {
                DevLog.log("Refresh falhou - usuario nao encontrado para cpf: " + userId);
                return new RuntimeException("Usuário não encontrado para o cpf da sessão: " + userId);
            });

        String newToken = jwtService.generateToken(
            usuario.getCpf(),
            usuario.getEmail(),
            usuario.getTipo()
        );

        // SameSite=Strict via header manual - API Cookie do Jakarta não expõe setSameSite()
        httpResponse.addHeader("Set-Cookie",
            String.format("refreshToken=%s; Path=/; HttpOnly; Secure; Max-Age=%d; SameSite=Strict",
                newSession.getRefreshId(), 12 * 60 * 60));

        RefreshResponseDTO response = new RefreshResponseDTO();
        response.setAccess_token(newToken);
        DevLog.log("Refresh OK - userId: " + userId + ", deviceId: " + request.getDeviceId());
        return ResponseEntity.ok(response);
    }

    // logout | revoga sessão, expira cookie e retorna dados do usuário se o access token ainda for válido
    @PostMapping("/logout")
    public ResponseEntity<LogoutResponseDTO> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse httpResponse) {

        DevLog.log("Requisição de logout recebida - refreshToken presente: " + (refreshToken != null));

        if (refreshToken != null) {
            refreshTokenService.revokeSession(refreshToken);
        }

        // sobrescreve o cookie com maxAge=0 para forçar expiração no browser
        httpResponse.addHeader("Set-Cookie",
            "refreshToken=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=Strict");

        LogoutResponseDTO logoutResponse = new LogoutResponseDTO();
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                JWTClaimsSet claims = jwtService.validateToken(token);
                String cpf = claims.getSubject();
                Usuario usuario = usuarioRepository.findByCpf(cpf).orElse(null);
                if (usuario != null) {
                    logoutResponse.setCpf(usuario.getCpf());
                    logoutResponse.setNome(usuario.getNome());
                    logoutResponse.setEmail(usuario.getEmail());
                    logoutResponse.setTipo(usuario.getTipo());
                }
            } catch (Exception ignored) {
                // token expirado ainda permite logout sem erros
            }
        }

        DevLog.log("Logout OK - cpf: " + logoutResponse.getCpf());
        return ResponseEntity.ok(logoutResponse);
    }
}
