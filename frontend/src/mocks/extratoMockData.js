import { toBrasiliaIso } from "../lib/dataUtils";

// Conta simulada do cliente logado
export const CONTA_CLIENTE = "3245";

/**
 * Seed de transações pré-criadas. Cada entrada representa uma operação
 * ocorrida "X dias, Y horas e Z minutos atrás" em relação ao momento
 * em que o módulo é carregado (ou seja, reseta a cada `npm run dev`).
 *
 * Campos:
 *   d   -> dias atrás
 *   h   -> horas atrás (além dos dias)
 *   m   -> minutos atrás (além das horas)
 *   tipo -> "saque" | "deposito" | "transferencia"
 *   orig -> conta/referência de origem
 *   dest -> conta/referência de destino
 *   val  -> valor em BRL
 */
const seedTransacoes = [
  {
    d: 0,
    h: 0,
    m: 35,
    tipo: "deposito",
    orig: "ATM-9983",
    dest: CONTA_CLIENTE,
    val: 2800.0,
  }, // salário
  {
    d: 0,
    h: 2,
    m: 10,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-0045",
    val: 89.9,
  }, // conta de luz
  {
    d: 1,
    h: 9,
    m: 0,
    tipo: "transferencia",
    orig: CONTA_CLIENTE,
    dest: "5432",
    val: 200.0,
  }, // pix enviado
  {
    d: 2,
    h: 14,
    m: 45,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-0342",
    val: 150.0,
  },
  {
    d: 3,
    h: 11,
    m: 20,
    tipo: "deposito",
    orig: "ATM-0342",
    dest: CONTA_CLIENTE,
    val: 50.0,
  }, // pix recebido
  {
    d: 5,
    h: 8,
    m: 5,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-0011",
    val: 1200.0,
  }, // aluguel
  {
    d: 6,
    h: 16,
    m: 30,
    tipo: "transferencia",
    orig: "3344",
    dest: CONTA_CLIENTE,
    val: 75.0,
  }, // recebido
  {
    d: 8,
    h: 13,
    m: 15,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-0117",
    val: 300.0,
  },
  {
    d: 9,
    h: 10,
    m: 50,
    tipo: "deposito",
    orig: "ATM-1122",
    dest: CONTA_CLIENTE,
    val: 500.0,
  }, // depósito avulso
  {
    d: 11,
    h: 9,
    m: 0,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-5566",
    val: 45.0,
  }, // streaming
  {
    d: 14,
    h: 7,
    m: 30,
    tipo: "transferencia",
    orig: CONTA_CLIENTE,
    dest: "8899",
    val: 120.0,
  }, // pix enviado
  {
    d: 15,
    h: 12,
    m: 0,
    tipo: "deposito",
    orig: "ATM-2237",
    dest: CONTA_CLIENTE,
    val: 1500.0,
  }, // freela
  {
    d: 18,
    h: 15,
    m: 20,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-0058",
    val: 200.0,
  },
  {
    d: 20,
    h: 9,
    m: 10,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-0099",
    val: 189.9,
  }, // plano internet
  {
    d: 22,
    h: 11,
    m: 45,
    tipo: "transferencia",
    orig: "6677",
    dest: CONTA_CLIENTE,
    val: 350.0,
  }, // recebido
  {
    d: 25,
    h: 14,
    m: 0,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-3344",
    val: 29.9,
  }, // assinatura
  {
    d: 28,
    h: 8,
    m: 30,
    tipo: "deposito",
    orig: "ATM-9988",
    dest: CONTA_CLIENTE,
    val: 2800.0,
  }, // salário mês anterior
  {
    d: 30,
    h: 10,
    m: 0,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-0342",
    val: 250.0,
  },
  {
    d: 32,
    h: 16,
    m: 15,
    tipo: "transferencia",
    orig: CONTA_CLIENTE,
    dest: "4455",
    val: 80.0,
  }, // pix enviado
  {
    d: 35,
    h: 9,
    m: 45,
    tipo: "saque",
    orig: CONTA_CLIENTE,
    dest: "ATM-7788",
    val: 65.0,
  }, // academia
];

// Calcula o delta de saldo de um seed (positivo = crédito, negativo = débito)
const calcularDeltaSeed = (seed) => {
  if (seed.tipo === "deposito") return seed.val;
  if (seed.tipo === "saque") return -seed.val;
  if (seed.tipo === "transferencia")
    return seed.orig === CONTA_CLIENTE ? -seed.val : seed.val;
  return 0;
};

// Saldo calculado a partir das transações pré-criadas  fonte única de verdade
export const SALDO_INICIAL = Number(
  seedTransacoes.reduce((acc, s) => acc + calcularDeltaSeed(s), 0).toFixed(2),
);

const gerarMovimentacoesIniciais = () => {
  const agora = Date.now();
  return seedTransacoes
    .map((seed, i) => {
      const offsetMs = (seed.d * 24 * 60 + seed.h * 60 + seed.m) * 60 * 1000;
      return {
        id: `mock-${i + 1}`,
        data: toBrasiliaIso(agora - offsetMs),
        tipo: seed.tipo,
        origem: seed.orig,
        destino: seed.dest,
        valor: seed.val,
      };
    })
    .sort((a, b) => new Date(b.data) - new Date(a.data));
};

/**
 * Estado inicial do protótipo  espelha exatamente o formato do backend:
 * { conta, saldo, movimentacoes }
 * Gerado uma vez no carregamento do módulo; reseta a cada `npm run dev`.
 */
export const contaMockInicial = {
  conta: CONTA_CLIENTE,
  saldo: SALDO_INICIAL,
  movimentacoes: gerarMovimentacoesIniciais(),
};
