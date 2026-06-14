import { API } from "../config.js";
import { getHttpErrorMessage } from "../utils/httpError.js";
import { getCpfUsuario } from "../utils/auth";

export const GerenteService = {
  listar: async () => {
    try {
      const response = await API.listarGerentes();

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao listar gerentes"));
    }
  },

  listarDashboard: async () => {
    try {
      const response = await API.listarDashboardGerentes();

      return response.data;
    } catch (err) {
      throw new Error(
        getHttpErrorMessage(err, "Erro ao carregar o dashboard dos gerentes"),
      );
    }
  },

  buscarPorCpf: async (cpf) => {
    try {
      const response = await API.buscarGerentePorCpf(cpf);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao buscar gerente"));
    }
  },

  criar: async (dados) => {
    try {
      const response = await API.criarGerente(dados);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao criar gerente"));
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

  listarMeusClientes: async () => {
    try {
      const response = await API.listarClientes();

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao listar seus clientes"));
    }
  },
};
