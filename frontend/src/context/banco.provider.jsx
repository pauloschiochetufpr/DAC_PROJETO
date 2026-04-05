import { useState, useRef, useCallback } from "react";
import { BancoContext } from "./banco.context";
import { contaMockInicial, CONTA_CLIENTE } from "../mocks/extratoMockData";
import { toBrasiliaIso } from "../lib/dataUtils";

// Determina o impacto da operação no saldo (positivo = crédito, negativo = débito)
const calcularDelta = (tipo, origem, valor) => {
  if (tipo === "deposito") return valor;
  if (tipo === "saque" || tipo === "pagamento") return -valor;
  if (tipo === "transferencia")
    return origem === CONTA_CLIENTE ? -valor : valor;
  return 0;
};

/**
 * Provê o estado em memória do protótipo.
 * Todo o estado é volátil: reseta a cada `npm run dev` / reload da página.
 *
 * adicionarTransacao simula uma chamada HTTP POST ao backend.
 * Retorna uma Promise que resolve com { status, message } — exatamente o
 * que um fetch real retornaria. O componente que chama JÁ DEVE usar
 * async/await e tratar o resultado, facilitando a troca pelo fetch real.
 *
 * Uso nos componentes:
 *
 *   const { adicionarTransacao } = useBanco();
 *
 *   const handleSubmit = async () => {
 *     try {
 *       const res = await adicionarTransacao({
 *         tipo: "transferencia",
 *         origem: "1234",
 *         destino: "5432",
 *         valor: 200.00,
 *         descricao: "Pix para Ana", // opcional
 *       });
 *       console.log(res.message); // "Operação registrada com sucesso."
 *     } catch (err) {
 *       console.error(err.message);
 *     }
 *   };
 *
 * Quando o backend estiver pronto, troca apenas o corpo de adicionarTransacao
 * por um fetch() — o componente não precisa mudar nada.
 */
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
