import { API } from "../config.js";
import { getHttpErrorMessage } from "../utils/httpError.js";

export const ClienteService = {
  buscarPorCpf: async (cpf) => {
    try {
      const response = await API.buscarPorCpf(cpf);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao buscar cliente"));
    }
  },

  listar: async () => {
    try {
      const response = await API.listar();

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao listar clientes"));
    }
  },

  listarComFiltro: async (filtro) => {
    try {
      const response = await API.listarComFiltro(filtro);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao filtrar clientes"));
    }
  },

  listarPendentes: async () => {
    try {
      const response = await API.listarComFiltro("para_aprovar");

      return response.data;
    } catch (err) {
      throw new Error(
        getHttpErrorMessage(err, "Erro ao listar clientes pendentes"),
      );
    }
  },

  aprovar: async (cpf) => {
    try {
      const response = await API.aprovar(cpf);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao aprovar cliente"));
    }
  },

  rejeitar: async (cpf, motivo) => {
    try {
      const response = await API.rejeitar(cpf, { motivo });

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao rejeitar cliente"));
    }
  },
};
