import { useState, useRef, useCallback } from "react";
import { BancoContext } from "./banco.context";
import { contaMockInicial, CONTA_CLIENTE } from "../mocks/extratoMockData";
import { toBrasiliaIso } from "../lib/dataUtils";

// Calcula delta de saldo (positivo = crédito, negativo = débito)
const calcularDelta = (tipo, origem, valor) => {
  if (tipo === "deposito") return valor;
  if (tipo === "saque" || tipo === "pagamento") return -valor;
  if (tipo === "transferencia")
    return origem === CONTA_CLIENTE ? -valor : valor;
  return 0;
};

export function BancoProvider({ children }) {
  const [conta] = useState(contaMockInicial.conta);
  const [saldo, setSaldo] = useState(contaMockInicial.saldo);
  const [movimentacoes, setMovimentacoes] = useState(
    contaMockInicial.movimentacoes,
  );

  // Ref para leitura síncrona do saldo dentro da Promise sem stale closure
  const saldoRef = useRef(contaMockInicial.saldo);

  const adicionarTransacao = useCallback(
    ({ tipo, origem, destino, valor, descricao }) =>
      new Promise((resolve) => {
        const delta = calcularDelta(tipo, origem, valor);

        if (delta < 0 && saldoRef.current + delta < 0) {
          resolve({ status: 422, message: "Saldo insuficiente." });
          return;
        }

        const novaTransacao = {
          id: crypto.randomUUID(),
          data: toBrasiliaIso(Date.now()),
          tipo,
          origem,
          destino,
          valor,
          ...(descricao !== undefined && { descricao }),
        };

        const novoSaldo = Number((saldoRef.current + delta).toFixed(2));
        saldoRef.current = novoSaldo;
        setSaldo(novoSaldo);
        setMovimentacoes((prev) => [novaTransacao, ...prev]);
        resolve({ status: 200, message: "Operação registrada com sucesso." });
      }),
    [],
  );

  return (
    <BancoContext.Provider
      value={{ conta, saldo, movimentacoes, adicionarTransacao }}
    >
      {children}
    </BancoContext.Provider>
  );
}
