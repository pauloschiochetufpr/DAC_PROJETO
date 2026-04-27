import { useState, useRef, useCallback } from "react";
import { BancoContext } from "./banco.context";
import { contaMockInicial, CONTA_CLIENTE } from "../mocks/extratoMockData";
import { perfilMockInicial } from "../mocks/perfilMockData";
import { toBrasiliaIso } from "../lib/dataUtils";

const AUTH_USER_STORAGE_KEY = "auth_user";

function readStoredAuthUser() {
  try {
    const stored = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

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

  const [usuario, setUsuario] = useState(() => readStoredAuthUser());
  const [client, setClient] = useState(perfilMockInicial.client);
  const [contaInfo] = useState(perfilMockInicial.contaInfo);

  const atualizarPerfil = useCallback((novosDados) => {
    return new Promise((resolve) => {
      setClient((prev) => {
        const atualizado = { ...prev, ...novosDados };

        const base = atualizado.salario >= 2000 ? atualizado.salario / 2 : 0;
        const saldoNegativoAbs =
          atualizado.saldo < 0 ? Math.abs(atualizado.saldo) : 0;

        atualizado.limite = base < saldoNegativoAbs ? saldoNegativoAbs : base;

        return atualizado;
      });

      resolve({
        status: 200,
        message: "Perfil atualizado com sucesso.",
      });
    });
  }, []);

  const salvarUsuarioAutenticado = useCallback((dadosUsuario) => {
    setUsuario(dadosUsuario);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(dadosUsuario));
  }, []);

  const limparUsuarioAutenticado = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    localStorage.removeItem("access_token");
  }, []);

  // Ref para leitura síncrona do saldo dentro da Promise sem stale closure
  const saldoRef = useRef(contaMockInicial.saldo);

  const adicionarTransacao = useCallback(
    ({ tipo, origem, destino, valor, descricao }) =>
      new Promise((resolve) => {
        const delta = calcularDelta(tipo, origem, valor);
        const limiteDisponivel = client.limite ?? 0;

        if (delta < 0 && saldoRef.current + limiteDisponivel + delta < 0) {
          resolve({ status: 422, message: "Saldo + limite insuficientes." });
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
      value={{
        conta,
        saldo,
        movimentacoes,
        adicionarTransacao,
        client,
        contaInfo,
        atualizarPerfil,
        usuario,
        salvarUsuarioAutenticado,
        limparUsuarioAutenticado,
      }}
    >
      {children}
    </BancoContext.Provider>
  );
}
