import { API } from "../config.js";
import { getHttpErrorMessage } from "../utils/httpError.js";

export const ContaService = {
  buscarExtrato: async (numero, filtros = {}) => {
    try {
      const response = await API.buscarExtrato(numero, filtros);
      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao buscar extrato"));
    }
  },
};
