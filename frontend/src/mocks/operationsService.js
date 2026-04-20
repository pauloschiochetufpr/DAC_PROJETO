import { contasMock } from "./contasMock";
import { toBrasiliaIso } from "../lib/dataUtils";

// helper: pega conta
const getConta = (numeroConta) => {
  return contasMock.find((c) => c.numeroConta === numeroConta);
};

// helper: calcula saldo atual
const recalcularSaldo = (conta) => {
  const saldo = conta.movimentacoes.reduce((acc, m) => {
    if (m.tipo === "deposito") return acc + m.valor;
    if (m.tipo === "saque" || m.tipo === "pagamento") return acc - m.valor;

    if (m.tipo === "transferencia") {
      return m.origem === conta.numeroConta ? acc - m.valor : acc + m.valor;
    }

    return acc;
  }, 0);

  conta.saldo = Number(saldo.toFixed(2));
};

// helper: adicionar movimentação
const addMov = (conta, mov) => {
  conta.movimentacoes.unshift({
    id: `mock-${Date.now()}`,
    data: toBrasiliaIso(Date.now()),
    ...mov,
  });
};

/**
 * SAQUE
 */
export const saque = ({ numeroConta, valor, origem = "CLIENTE" }) => {
  const conta = getConta(numeroConta);
  if (!conta) throw new Error("Conta não existe");

  const limite = 500; // mock de limite (depois vem do cliente)
  const saldoDisponivel = conta.saldo + limite;

  if (valor > saldoDisponivel) {
    throw new Error("Saldo insuficiente (incluindo limite)");
  }

  addMov(conta, {
    tipo: "saque",
    origem: numeroConta,
    destino: origem,
    valor,
  });

  recalcularSaldo(conta);

  return conta;
};

/**
 * DEPÓSITO
 */
export const deposito = ({ numeroConta, valor }) => {
  const conta = getConta(numeroConta);
  if (!conta) throw new Error("Conta não existe");

  addMov(conta, {
    tipo: "deposito",
    origem: "ATM",
    destino: numeroConta,
    valor,
  });

  recalcularSaldo(conta);

  return conta;
};

/**
 * TRANSFERÊNCIA
 */
export const transferencia = ({ from, to, valor }) => {
  const contaFrom = getConta(from);
  const contaTo = getConta(to);

  if (!contaFrom) throw new Error("Conta origem não existe");
  if (!contaTo) throw new Error("Conta destino não existe");

  const limite = 500;
  const saldoDisponivel = contaFrom.saldo + limite;

  if (valor > saldoDisponivel) {
    throw new Error("Saldo insuficiente (incluindo limite)");
  }

  // saída
  addMov(contaFrom, {
    tipo: "transferencia",
    origem: from,
    destino: to,
    valor,
  });

  // entrada (espelho)
  addMov(contaTo, {
    tipo: "transferencia",
    origem: from,
    destino: to,
    valor,
  });

  recalcularSaldo(contaFrom);
  recalcularSaldo(contaTo);

  return { contaFrom, contaTo };
};

/**
 * debug helper
 */
export const getContas = () => contasMock;
