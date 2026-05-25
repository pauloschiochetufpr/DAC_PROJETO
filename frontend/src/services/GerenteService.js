import { axiosAuth } from "../config.js";

export const GerenteService = {
  /** GET /gerentes */
  listar: () => axiosAuth.get("/gerentes"),

  /** GET /gerentes/:cpf */
  buscarPorCpf: (cpf) => axiosAuth.get(`/gerentes/${cpf}`),

  /** PUT /gerentes/:cpf */
  atualizar: (cpf, data) => axiosAuth.put(`/gerentes/${cpf}`, data),

  /** DELETE /gerentes/:cpf */
  excluir: (cpf) => axiosAuth.delete(`/gerentes/${cpf}`),

  /** GET /gerentes/:cpf/clientes */
  listarClientes: (cpf) => axiosAuth.get(`/gerentes/${cpf}/clientes`),
};
