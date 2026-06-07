package com.dac.auth.service;

// DTOs
import com.dac.auth.dto.request.BotLoginRequestDTO;
import com.dac.auth.dto.response.BotLoginResponseDTO;
// entidades
import com.dac.auth.entity.Usuario;
// exceções
import com.dac.auth.exception.AuthenticationException;
// config
import com.dac.auth.config.BotEmailsConfig;
// repositórios
import com.dac.auth.repository.UsuarioRepository;
// util
import com.dac.auth.util.DevLog;
// Spring
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class BotAuthService {

    // CPF e nome mock usados quando o usuário não tem esses dados cadastrados
    private static final String MOCK_CPF  = "00000000000";
    private static final String MOCK_TIPO = "CLIENTE";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private BotEmailsConfig botEmailsConfig;

    // login | valida credenciais do bot e emite access token sem session/device
    public BotLoginResponseDTO login(BotLoginRequestDTO request) {
        DevLog.log("BotLogin - email: " + request.getLogin());

        if (!botEmailsConfig.isBotEmail(request.getLogin())) {
            DevLog.log("BotLogin rejeitado - email nao esta na lista de emails do bot: " + request.getLogin());
            throw new AuthenticationException("Credenciais inválidas");
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(request.getLogin());
        if (usuarioOpt.isEmpty()) {
            DevLog.log("BotLogin rejeitado - email nao encontrado no banco: " + request.getLogin());
            throw new AuthenticationException("Credenciais inválidas");
        }

        Usuario usuario = usuarioOpt.get();
        boolean senhaValida = false;
        String senhaPersistida = usuario.getSenhaHash();
        String senhaInformada = request.getSenha();

        if (senhaPersistida != null && senhaInformada != null) {
            if (passwordEncoder.matches(senhaInformada, senhaPersistida)) {
                senhaValida = true;
            } else if (senhaPersistida.equals(senhaInformada)) {
                // senha em texto puro (dados iniciais) aceita diretamente sem migrar
                senhaValida = true;
            }
        }

        if (!senhaValida) {
            DevLog.log("BotLogin rejeitado - senha invalida para email: " + request.getLogin());
            throw new AuthenticationException("Credenciais inválidas");
        }

        // CPF e tipo podem estar ausentes em seeds incompletos; usa mock fixo para não quebrar o token
        String cpf  = (usuario.getCpf()  != null && !usuario.getCpf().isBlank())  ? usuario.getCpf()  : MOCK_CPF;
        String tipo = (usuario.getTipo() != null && !usuario.getTipo().isBlank())  ? usuario.getTipo().toUpperCase() : MOCK_TIPO;

        String token;
        try {
            token = jwtService.generateToken(cpf, usuario.getEmail(), tipo);
        } catch (Exception e) {
            DevLog.log("BotLogin - erro ao gerar token para email: " + request.getLogin() + " - " + e.getMessage());
            throw new RuntimeException("Erro ao gerar token de acesso", e);
        }

        BotLoginResponseDTO.UsuarioDTO usuarioDTO = new BotLoginResponseDTO.UsuarioDTO();
        usuarioDTO.setCpf(cpf);
        usuarioDTO.setEmail(usuario.getEmail());

        BotLoginResponseDTO response = new BotLoginResponseDTO();
        response.setAccess_token(token);
        response.setTipo(tipo);
        response.setUsuario(usuarioDTO);

        DevLog.log("BotLogin OK - email: " + request.getLogin() + ", tipo: " + tipo);
        return response;
    }
}
