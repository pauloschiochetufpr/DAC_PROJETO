/**
 * Mock de dados do gerente  gera clientes pendentes de aprovação e
 * clientes já aprovados (com conta) a cada carregamento do módulo.
 * Reseta em cada `npm run dev` / reload, assim como extratoMockData.
 *
 * Dois conjuntos independentes:
 *   clientesPendentesInicial -> tabela de autocadastros (Função 1)
 *   clientesAprovadosInicial -> tabela de clientes com conta (Função 2)
 */

// ── ID fixo do gerente logado (simulação) ──────────────────────────────
export const GERENTE_ID = 1;

// ── Helpers de aleatorização ───────────────────────────────────────────
const nomes = [
  "Ana",
  "Bruno",
  "Carlos",
  "Diana",
  "Eduardo",
  "Fernanda",
  "Gabriel",
  "Helena",
  "Igor",
  "Julia",
  "Lucas",
  "Marina",
  "Nicolas",
  "Olivia",
  "Pedro",
  "Raquel",
  "Samuel",
  "Tatiana",
  "Vitor",
  "Wanda",
];

const sobrenomes = [
  "Silva",
  "Santos",
  "Oliveira",
  "Souza",
  "Rodrigues",
  "Ferreira",
  "Almeida",
  "Pereira",
  "Lima",
  "Gomes",
  "Costa",
  "Ribeiro",
  "Martins",
  "Carvalho",
  "Araújo",
  "Melo",
  "Barbosa",
  "Cardoso",
  "Nascimento",
  "Moura",
];

const cidadesEstados = [
  { cidade: "Curitiba", estado: "PR" },
  { cidade: "São Paulo", estado: "SP" },
  { cidade: "Rio de Janeiro", estado: "RJ" },
  { cidade: "Belo Horizonte", estado: "MG" },
  { cidade: "Porto Alegre", estado: "RS" },
  { cidade: "Florianópolis", estado: "SC" },
  { cidade: "Brasília", estado: "DF" },
  { cidade: "Salvador", estado: "BA" },
  { cidade: "Recife", estado: "PE" },
  { cidade: "Fortaleza", estado: "CE" },
];

const ruas = [
  "Rua das Flores",
  "Av. Brasil",
  "Rua XV de Novembro",
  "Al. Santos",
  "Rua Marechal Deodoro",
  "Av. Sete de Setembro",
  "Rua Padre Anchieta",
  "Rua Comendador Araújo",
  "Av. República Argentina",
  "Rua Barão do Rio Branco",
];

/** Inteiro aleatório no intervalo [min, max] */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Escolhe item aleatório de um array */
const pick = (arr) => arr[randInt(0, arr.length - 1)];

/** CPF aleatório (11 dígitos, sem validação  é mock) */
const gerarCpf = () => String(randInt(10000000000, 99999999999));

/** Nome completo aleatório */
const gerarNome = () => `${pick(nomes)} ${pick(sobrenomes)}`;

/** E-mail baseado no nome */
const gerarEmail = (nome) => {
  const slug = nome
    .toLowerCase()
    .replace(/\s+/g, ".")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return `${slug}@bantads.com.br`;
};

/** Salário entre R$ 1.500 e R$ 15.000, arredondado em centenas */
const gerarSalario = () => Math.round(randInt(1500, 15000) / 100) * 100;

/** Cidade + estado aleatórios (pareados) */
const gerarCidadeEstado = () => pick(cidadesEstados);

/** Endereço aleatório */
const gerarEndereco = () => `${pick(ruas)}, nº ${randInt(1, 999)}`;

/** Conta  string de 4 dígitos */
const gerarConta = () => String(randInt(1000, 9999));

/** Saldo aleatório entre 0 e 50 000 */
const gerarSaldo = () => Number((Math.random() * 50000).toFixed(2));

/** Telefone aleatório no formato (XX) 9 XXXX-XXXX */
const gerarTelefone = () =>
  `(${randInt(11, 99)}) 9 ${String(randInt(1000, 9999))}-${String(randInt(1000, 9999))}`;

/** Dados fictícios de gerentes para preencher campos gerente_* nos clientes */
const gerentesFixos = [
  { cpf: "98574307084", nome: "Geniève", email: "ger1@bantads.com.br" },
  { cpf: "45128976032", nome: "Roberto", email: "ger2@bantads.com.br" },
  { cpf: "72310548091", nome: "Luciana", email: "ger3@bantads.com.br" },
  { cpf: "31456820075", nome: "Marcos", email: "ger4@bantads.com.br" },
  { cpf: "60893214056", nome: "Patrícia", email: "ger5@bantads.com.br" },
];

/** Retorna dados do gerente pelo idGerente (1-indexed) */
const getGerenteInfo = (id) => gerentesFixos[(id - 1) % gerentesFixos.length];

// ── Geração: clientes pendentes (autocadastro  Função 1) ─────────────
/**
 * Gera 5 pendentes para GERENTE_ID e 2 para gerentes aleatórios,
 * demonstrando que apenas os do gerente logado serão exibidos.
 */
function gerarClientesPendentes() {
  const lista = [];

  // Pendentes do gerente logado
  for (let i = 0; i < 5; i++) {
    const nome = gerarNome();
    const { cidade, estado } = gerarCidadeEstado();
    lista.push({
      cpf: gerarCpf(),
      nome,
      telefone: gerarTelefone(),
      email: gerarEmail(nome),
      salario: gerarSalario(),
      endereco: gerarEndereco(),
      cidade,
      estado,
      idGerente: GERENTE_ID,
      status: "pendente", // pendente | aprovado | rejeitado
      motivoRejeicao: null,
      dataDecisao: null,
    });
  }

  // Pendentes de outros gerentes (não devem aparecer na tela)
  for (let i = 0; i < 2; i++) {
    const nome = gerarNome();
    const { cidade, estado } = gerarCidadeEstado();
    lista.push({
      cpf: gerarCpf(),
      nome,
      telefone: gerarTelefone(),
      email: gerarEmail(nome),
      salario: gerarSalario(),
      endereco: gerarEndereco(),
      cidade,
      estado,
      idGerente: randInt(2, 5),
      status: "pendente",
      motivoRejeicao: null,
      dataDecisao: null,
    });
  }

  return lista;
}

// ── Geração: clientes aprovados (com conta  Função 2) ────────────────
/**
 * Gera 8 clientes do gerente logado e 4 de outros gerentes.
 * Cada cliente já possui conta, saldo e limite calculado.
 */
function gerarClientesAprovados() {
  const lista = [];

  // Clientes do gerente logado
  for (let i = 0; i < 8; i++) {
    const nome = gerarNome();
    const { cidade, estado } = gerarCidadeEstado();
    const salario = gerarSalario();
    const limite = salario >= 2000 ? salario / 2 : 0;
    const ger = getGerenteInfo(GERENTE_ID);
    lista.push({
      cpf: gerarCpf(),
      nome,
      telefone: gerarTelefone(),
      email: gerarEmail(nome),
      salario,
      endereco: gerarEndereco(),
      cidade,
      estado,
      idGerente: GERENTE_ID,
      conta: gerarConta(),
      saldo: gerarSaldo(),
      limite,
      gerente: ger.cpf,
      gerente_nome: ger.nome,
      gerente_email: ger.email,
    });
  }

  // Clientes de outros gerentes
  for (let i = 0; i < 4; i++) {
    const nome = gerarNome();
    const { cidade, estado } = gerarCidadeEstado();
    const salario = gerarSalario();
    const limite = salario >= 2000 ? salario / 2 : 0;
    const gerId = randInt(2, 5);
    const ger = getGerenteInfo(gerId);
    lista.push({
      cpf: gerarCpf(),
      nome,
      telefone: gerarTelefone(),
      email: gerarEmail(nome),
      salario,
      endereco: gerarEndereco(),
      cidade,
      estado,
      idGerente: gerId,
      conta: gerarConta(),
      saldo: gerarSaldo(),
      limite,
      gerente: ger.cpf,
      gerente_nome: ger.nome,
      gerente_email: ger.email,
    });
  }

  return lista;
}

// ── Exports (gerados uma vez no carregamento do módulo) ────────────────
export const clientesPendentesInicial = gerarClientesPendentes();
export const clientesAprovadosInicial = gerarClientesAprovados();
