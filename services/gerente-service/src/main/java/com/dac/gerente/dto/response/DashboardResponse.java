package com.dac.gerente.dto.response;

import java.util.List;

public class DashboardResponse {

    private List<ItemDashboardResponse> dados;

    public DashboardResponse() {}

    public DashboardResponse(List<ItemDashboardResponse> dados) {
        this.dados = dados;
    }

    public List<ItemDashboardResponse> getDados() {
        return dados;
    }

    public void setDados(List<ItemDashboardResponse> dados) {
        this.dados = dados;
    }
}