import { axiosAuth } from "../config.js";

export const ClienteService = {
  /** GET /clientes/:cpf */
  buscarPorCpf: (cpf) => axiosAuth.get(`/clientes/${cpf}`),

  /** GET /clientes */
  listar: () => axiosAuth.get("/clientes"),

  /** GET /clientes requestParams */
  listarComFiltro: (filtro) =>
    axiosAuth.get("/clientes", {
      params: { filtro },
    }),

  /** GET /clientes requestParams para_aprovar */
  listarPendentes: () =>
    API.listarClientesComParametro({
      filtro: "para_aprovar",
    }),

  /** POST /clientes/:cpf/aprovar */
  aprovar: (cpf) => axiosAuth.post(`/clientes/${cpf}/aprovar`),

  /** POST /clientes/:cpf/rejeitar */
  rejeitar: (cpf, motivo) =>
    axiosAuth.post(`/clientes/${cpf}/rejeitar`, {
      motivo,
    }),
};
