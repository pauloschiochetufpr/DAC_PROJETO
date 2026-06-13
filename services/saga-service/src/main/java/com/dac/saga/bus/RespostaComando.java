package com.dac.saga.bus;

import java.util.Map;

// RespostaComando | resposta de um serviço a um comando da saga, correlacionada pelo correlationId
public class RespostaComando {

    private String correlationId;
    private boolean sucesso;
    private String erro;
    private Map<String, Object> dados;

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public boolean isSucesso() { return sucesso; }
    public void setSucesso(boolean sucesso) { this.sucesso = sucesso; }

    public String getErro() { return erro; }
    public void setErro(String erro) { this.erro = erro; }

    public Map<String, Object> getDados() { return dados; }
    public void setDados(Map<String, Object> dados) { this.dados = dados; }
}
