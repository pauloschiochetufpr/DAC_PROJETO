package com.dac.auth.config;

// Jackson
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
// Spring
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class BotEmailsConfig {

    // conjunto de emails autorizados para o fluxo alternativo do bot
    private final Set<String> emails = new HashSet<>();

    // padrão gerado aleatoriamente pelo bot do professor: func_XX@gmail.com (XX = 2 dígitos)
    private static final Pattern BOT_FUNC_PATTERN = Pattern.compile("^func_\\d{2}@gmail\\.com$");

    // load | carrega a lista de emails do bot a partir de bot-emails.json no classpath
    @PostConstruct
    public void load() {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("bot-emails.json")) {
            if (is == null) return;
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(is);
            JsonNode lista = root.get("emails");
            if (lista != null && lista.isArray()) {
                lista.forEach(node -> emails.add(node.asText().toLowerCase()));
            }
        } catch (Exception e) {
            // falha ao carregar não deve derrubar o serviço; bot-login retornará 401 para todos
        }
    }

    // isBotEmail | retorna true se o email está na lista fixa ou corresponde ao padrão func_XX@gmail.com
    public boolean isBotEmail(String email) {
        if (email == null) return false;
        String lower = email.toLowerCase();
        return emails.contains(lower) || BOT_FUNC_PATTERN.matcher(lower).matches();
    }
}
