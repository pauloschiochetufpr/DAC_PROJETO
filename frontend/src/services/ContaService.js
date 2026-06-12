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

  depositar: async (numero, valor) => {
    try {
      const response = await API.depositar(numero, valor);
      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao realizar depósito"));
    }
  },

  sacar: async (numero, valor) => {
    try {
      const response = await API.sacar(numero, valor);
      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao realizar saque"));
    }
  },

  transferir: async (numero, destino, valor) => {
    try {
      const response = await API.transferir(numero, destino, valor);
      return response.data;
    } catch (err) {
      throw new Error(
        getHttpErrorMessage(err, "Erro ao realizar transferência"),
      );
    }
  },
};
