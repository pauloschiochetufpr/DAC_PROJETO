/**
 * Mock de dados do administrador.
 * Contém gerentes e clientes de todo o banco (todos os gerentes).
 * Reseta a cada reload  mesmo padrão dos outros mocks.
 */

// ── Helpers ────────────────────────────────────────────────────────────
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
  "Cesar",
  "Débora",
  "Erick",
  "Flávia",
  "Gustavo",
  "Isabela",
  "João",
  "Kelly",
  "Leandro",
  "Márcia",
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
const cidadesEstados = [
  { cidade: "Curitiba", estado: "PR" },
  { cidade: "São Paulo", estado: "SP" },
  { cidade: "Rio de Janeiro", estado: "RJ" },
  { cidade: "Belo Horizonte", estado: "MG" },
  { cidade: "Porto Alegre", estado: "RS" },
  { cidade: "Florianópolis", estado: "SC" },
  { cidade: "Brasília", estado: "DF" },
  { cidade: "Salvador", estado: "BA" },
];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const gerarCpf = () => String(randInt(10000000000, 99999999999));
const gerarNome = () => `${pick(nomes)} ${pick(sobrenomes)}`;
const gerarEmail = (nome) =>
  nome
    .toLowerCase()
    .replace(/\s+/g, ".")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") + "@bantads.com.br";
const gerarTelefone = () =>
  `(${randInt(11, 99)}) 9 ${String(randInt(1000, 9999))}-${String(randInt(1000, 9999))}`;
const gerarSalario = () => Math.round(randInt(1500, 18000) / 100) * 100;
const gerarCidadeEstado = () => pick(cidadesEstados);
const gerarEndereco = () => `${pick(ruas)}, nº ${randInt(1, 999)}`;
const gerarConta = () => String(randInt(1000, 9999));

/** Saldo: pode ser negativo (20% de chance), para demonstrar R15 */
const gerarSaldo = () => {
  const negativo = Math.random() < 0.2;
  const base = Number((Math.random() * 45000).toFixed(2));
  return negativo ? -base : base;
};

// Gerentes fixos do banco
export const gerentesData = [
  {
    id: 1,
    cpf: "98574307084",
    nome: "Geniève Monteiro",
    email: "genieve.monteiro@bantads.com.br",
    telefone: "(41) 9 8834-2210",
    cidade: "Curitiba",
    estado: "PR",
  },
  {
    id: 2,
    cpf: "45128976032",
    nome: "Roberto Faria",
    email: "roberto.faria@bantads.com.br",
    telefone: "(11) 9 9123-5544",
    cidade: "São Paulo",
    estado: "SP",
  },
  {
    id: 3,
    cpf: "72310548091",
    nome: "Luciana Bastos",
    email: "luciana.bastos@bantads.com.br",
    telefone: "(21) 9 7765-3310",
    cidade: "Rio de Janeiro",
    estado: "RJ",
  },
  {
    id: 4,
    cpf: "31456820075",
    nome: "Marcos Andrade",
    email: "marcos.andrade@bantads.com.br",
    telefone: "(31) 9 8821-6699",
    cidade: "Belo Horizonte",
    estado: "MG",
  },
  {
    id: 5,
    cpf: "60893214056",
    nome: "Patrícia Duarte",
    email: "patricia.duarte@bantads.com.br",
    telefone: "(51) 9 9933-4477",
    cidade: "Porto Alegre",
    estado: "RS",
  },
  {
    id: 6,
    cpf: "11234567890",
    nome: "Renato Cavalcante",
    email: "renato.cavalcante@bantads.com.br",
    telefone: "(85) 9 8812-3366",
    cidade: "Fortaleza",
    estado: "CE",
  },
  {
    id: 7,
    cpf: "23456789012",
    nome: "Simone Teixeira",
    email: "simone.teixeira@bantads.com.br",
    telefone: "(48) 9 7741-9900",
    cidade: "Florianópolis",
    estado: "SC",
  },
  {
    id: 8,
    cpf: "34567890123",
    nome: "Diego Mendonça",
    email: "diego.mendonca@bantads.com.br",
    telefone: "(81) 9 9987-2233",
    cidade: "Recife",
    estado: "PE",
  },
  {
    id: 9,
    cpf: "45678901234",
    nome: "Aline Fonseca",
    email: "aline.fonseca@bantads.com.br",
    telefone: "(92) 9 8866-5511",
    cidade: "Manaus",
    estado: "AM",
  },
  {
    id: 10,
    cpf: "56789012345",
    nome: "Tiago Pinheiro",
    email: "tiago.pinheiro@bantads.com.br",
    telefone: "(62) 9 7712-4480",
    cidade: "Goiânia",
    estado: "GO",
  },
  {
    id: 11,
    cpf: "67890123456",
    nome: "Carla Drummond",
    email: "carla.drummond@bantads.com.br",
    telefone: "(84) 9 9934-7766",
    cidade: "Natal",
    estado: "RN",
  },
  {
    id: 12,
    cpf: "78901234567",
    nome: "Fábio Rezende",
    email: "fabio.rezende@bantads.com.br",
    telefone: "(27) 9 8851-3322",
    cidade: "Vitória",
    estado: "ES",
  },
];

// Geração de clientes distribuídos entre todos os gerentes
function gerarClientesAdmin() {
  // ~5-7 clientes por gerente, distribuição variada
  const distribuicao = [7, 6, 7, 6, 5, 6, 5, 6, 5, 7, 5, 6]; // por gerenteId 1..12
  const lista = [];

  gerentesData.forEach((ger, idx) => {
    const qtd = distribuicao[idx];
    for (let i = 0; i < qtd; i++) {
      const nome = gerarNome();
      const { cidade, estado } = gerarCidadeEstado();
      const salario = gerarSalario();
      const limite = salario >= 2000 ? salario / 2 : 0;
      lista.push({
        cpf: gerarCpf(),
        nome,
        telefone: gerarTelefone(),
        email: gerarEmail(nome),
        salario,
        endereco: gerarEndereco(),
        cidade,
        estado,
        idGerente: ger.id,
        conta: gerarConta(),
        saldo: gerarSaldo(),
        limite,
        gerente_cpf: ger.cpf,
        gerente_nome: ger.nome,
      });
    }
  });

  return lista;
}

export const clientesAdminData = gerarClientesAdmin();

// Mock de chamadas HTTP

/**
 * GET /admin/gerentes
 * Retorna gerentes com estatísticas agregadas dos clientes.
 * Ordenado por somaSaldosPositivos desc (R15).
 */
export const getGerentesAdmin = () =>
  new Promise((resolve) => {
    try {
      const stats = gerentesData.map((ger) => {
        const clientesGer = clientesAdminData.filter(
          (c) => c.idGerente === ger.id,
        );
        const somaSaldosPositivos = clientesGer
          .filter((c) => c.saldo >= 0)
          .reduce((acc, c) => acc + c.saldo, 0);
        const somaSaldosNegativos = clientesGer
          .filter((c) => c.saldo < 0)
          .reduce((acc, c) => acc + c.saldo, 0);
        return {
          ...ger,
          totalClientes: clientesGer.length,
          somaSaldosPositivos,
          somaSaldosNegativos,
        };
      });

      // Maiores saldos positivos primeiro
      const sorted = stats.sort(
        (a, b) => b.somaSaldosPositivos - a.somaSaldosPositivos,
      );
      resolve({ status: 200, data: sorted });
    } catch {
      resolve({ status: 500, message: "Erro interno do mock." });
    }
  });

/**
 * GET /admin/clientes
 * Retorna todos os clientes do banco ordenados por nome asc (R16).
 */
export const getClientesAdmin = () =>
  new Promise((resolve) => {
    try {
      const sorted = [...clientesAdminData].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR"),
      );
      resolve({ status: 200, data: sorted });
    } catch {
      resolve({ status: 500, message: "Erro interno do mock." });
    }
  });

/**
 * GET /admin/clientes?offset=X&limit=Y
 * Paginação para lazy loading  retorna fatia ordenada por nome.
 */
export const getClientesAdminPaginado = (offset = 0, limit = 15) =>
  new Promise((resolve) => {
    try {
      const sorted = [...clientesAdminData].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR"),
      );
      const slice = sorted.slice(offset, offset + limit);
      resolve({
        status: 200,
        data: slice,
        total: sorted.length,
        hasMore: offset + limit < sorted.length,
      });
    } catch {
      resolve({ status: 500, message: "Erro interno do mock." });
    }
  });

/**
 * GET /admin/clientes/search?q=termo&limit=N
 * Busca por nome ou CPF  base para autocomplete e filtro.
 * limit = 0 -> sem limite (retorna todos os matches).
 */
export const searchClientesAdmin = (termo, limit = 8) =>
  new Promise((resolve) => {
    // Simula latência mínima de rede
    setTimeout(() => {
      try {
        const t = termo.trim().toLowerCase();
        if (!t) {
          resolve({ status: 200, data: [], total: 0 });
          return;
        }
        const sorted = [...clientesAdminData].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        );
        const encontrados = sorted.filter(
          (c) => c.cpf.includes(t) || c.nome.toLowerCase().includes(t),
        );
        const data = limit > 0 ? encontrados.slice(0, limit) : encontrados;
        resolve({ status: 200, data, total: encontrados.length });
      } catch {
        resolve({ status: 500, message: "Erro interno do mock." });
      }
    }, 60);
  });
