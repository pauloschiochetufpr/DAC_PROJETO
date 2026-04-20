// Conta do cliente (mesma do extrato pra manter coerência mínima)
export const CONTA_CLIENTE = "3245";

// Dados do perfil
export const perfilMockInicial = {
  client: {
    nome: "Carlos Eduardo",
    cpf: "123.456.789-10",
    salario: 3000,
    limite: 1500, // pode recalcular depois se quiser
    email: "cli1@bantads.com.br",
    telefone: "(44) 99999-8888",
  },

  contaInfo: {
    conta: CONTA_CLIENTE,
    gerente: "Fernanda Souza",
  },
};
