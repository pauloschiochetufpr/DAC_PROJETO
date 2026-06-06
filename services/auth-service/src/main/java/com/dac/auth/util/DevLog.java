package com.dac.auth.util;

// java IO e tempo
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

// DevLog | utilitário de log para desenvolvimento, desabilitar em produção setando ENABLED = false
public class DevLog {

    // flag que controla se o log está ativo
    private static final boolean ENABLED = true;

    // caminho do arquivo de log gerado dentro do serviço
    private static final String LOG_FILE = "dev.log.txt";

    // formato de data e hora usado nos registros
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // log | registra a mensagem com timestamp e nome da classe chamadora
    public static void log(String message) {
        if (!ENABLED) return;

        // obtém o elemento da pilha que chamou este método (índice 2 = caller direto)
        StackTraceElement caller = Thread.currentThread().getStackTrace()[2];
        String callerName = caller.getClassName() + "." + caller.getMethodName() + ":" + caller.getLineNumber();

        // timestamp atual formatado
        String timestamp = LocalDateTime.now().format(FORMATTER);

        String entry = "[" + timestamp + "] [" + callerName + "] " + message;

        System.out.println(entry);

        try (PrintWriter writer = new PrintWriter(new FileWriter(LOG_FILE, true))) {
            writer.println(entry);
        } catch (IOException e) {
            System.err.println("DevLog: falha ao escrever no arquivo de log - " + e.getMessage());
        }
    }
}
