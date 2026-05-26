import { API } from "../config.js";
import { getHttpErrorMessage } from "../utils/httpError.js";
import { getCpfUsuario } from "../utils/auth";

export const GerenteService = {
  listar: async () => {
    try {
      const response = await API.listar();

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao listar gerentes"));
    }
  },

  buscarPorCpf: async (cpf) => {
    try {
      const response = await API.buscarPorCpf(cpf);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao buscar gerente"));
    }
  },

  atualizar: async (cpf, data) => {
    try {
      const response = await API.atualizar(cpf, data);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao atualizar gerente"));
    }
  },

  excluir: async (cpf) => {
    try {
      const response = await API.excluir(cpf);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao excluir gerente"));
    }
  },

  listarClientes: async (cpf) => {
    try {
      const response = await API.listarClientes(cpf);

      return response.data;
    } catch (err) {
      throw new Error(
        getHttpErrorMessage(err, "Erro ao listar clientes do gerente"),
      );
    }
  },

  listarMeusClientes: async () => {
    try {
      const cpf = getCpfUsuario();

      if (!cpf) {
        throw new Error("Usuário não autenticado");
      }

      const response = await API.listarClientes(cpf);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao listar seus clientes"));
    }
  },
};
