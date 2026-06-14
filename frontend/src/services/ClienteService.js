import { API } from "../config.js";
import { getHttpErrorMessage } from "../utils/httpError.js";

export const ClienteService = {
  buscarPorCpf: async (cpf) => {
    try {
      const response = await API.buscarClientePorCpf(cpf);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao buscar cliente"));
    }
  },

  listar: async () => {
    try {
      const response = await API.listarClientes();

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
      const response = await API.listarPendentes();

      return response.data;
    } catch (err) {
      throw new Error(
        getHttpErrorMessage(err, "Erro ao listar clientes pendentes"),
      );
    }
  },

  listarRelatorioAdmin: async () => {
    try {
      const response = await API.listarClientesRelatorioAdmin();

      return response.data;
    } catch (err) {
      throw new Error(
        getHttpErrorMessage(err, "Erro ao carregar relatório de clientes"),
      );
    }
  },

  atualizarPerfil: async (cpf, dados) => {
    try {
      const response = await API.atualizarPerfilCliente(cpf, dados);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao atualizar perfil"));
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
      const response = await API.rejeitarCliente(cpf, motivo);

      return response.data;
    } catch (err) {
      throw new Error(getHttpErrorMessage(err, "Erro ao rejeitar cliente"));
    }
  },
};
