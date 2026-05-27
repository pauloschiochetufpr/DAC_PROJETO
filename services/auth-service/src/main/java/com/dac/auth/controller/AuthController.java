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

        if (request.getEmail() == null || request.getEmail().isBlank() ||
            request.getPassword() == null || request.getPassword().isBlank() ||
            request.getDeviceId() == null || request.getDeviceId().isBlank() ||
            request.getDeviceName() == null || request.getDeviceName().isBlank()) 
        {
            return ResponseEntity.badRequest().body(new ErrorResponseDTO(400, "Campos obrigatórios ausentes ou em branco"));
        }
        
        // gateway injeta X-Forwarded-For via xfwd:true; fallback para remoteAddr em dev local
        String ip = httpRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank())
            ip = httpRequest.getRemoteAddr();


        AuthService.LoginResult result = authService.login(request, ip);

        // SameSite=Strict via header manual | API Cookie do Jakarta não expõe setSameSite()
        httpResponse.addHeader("Set-Cookie",
            String.format("refreshToken=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=Strict",
                result.refreshId(), 12 * 60 * 60));

        return ResponseEntity.ok(result.response());
    }

    // refresh | valida cookie de refresh, rotaciona sessão e emite novo access token JWE
    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponseDTO> refresh(
            @RequestBody RefreshRequestDTO request,
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (refreshToken == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            String ip = httpRequest.getRemoteAddr();
            Session newSession = refreshTokenService.rotateSession(
                refreshToken, request.getDeviceId(), ip);

            // userId null indica inconsistência no banco; não deve ocorrer em fluxo normal
            String userId = newSession.getUserId();
            if (userId == null) throw new RuntimeException("Sessão sem userId");

            Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            String newToken = jwtService.generateToken(
                usuario.getCpf(),
                usuario.getEmail(),
                usuario.getTipo()
            );

            // SameSite=Strict via header manual — API Cookie do Jakarta não expõe setSameSite()
            httpResponse.addHeader("Set-Cookie",
                String.format("refreshToken=%s; Path=/; HttpOnly; Max-Age=%d; SameSite=Strict",
                    newSession.getRefreshId(), 12 * 60 * 60));

            RefreshResponseDTO response = new RefreshResponseDTO();
            response.setAccess_token(newToken);
            return ResponseEntity.ok(response);

        } catch (SecurityException e) {
            String msg = e.getMessage();
            if ("REPLAY_DETECTED".equals(msg) ||
                "DEVICE_BLACKLISTED".equals(msg) ||
                "DEVICE_MISMATCH".equals(msg)) {
                return ResponseEntity.status(403).build();
            }
            return ResponseEntity.status(401).build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // logout | revoga sessão, expira cookie e retorna dados do usuário se o access token ainda for válido
    @PostMapping("/logout")
    public ResponseEntity<LogoutResponseDTO> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse httpResponse) {

        if (refreshToken != null) {
            refreshTokenService.revokeSession(refreshToken);
        }

        // sobrescreve o cookie com maxAge=0 para forçar expiração no browser
        httpResponse.addHeader("Set-Cookie",
            "refreshToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict");

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

        return ResponseEntity.ok(logoutResponse);
    }
}
