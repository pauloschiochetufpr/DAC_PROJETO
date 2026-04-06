import { useState, useCallback } from "react";
import { GerenteContext } from "./gerente.context";
import {
  clientesPendentesInicial,
  clientesAprovadosInicial,
  GERENTE_ID,
} from "../mocks/gerenteMockData";
import { toBrasiliaIso } from "../lib/dataUtils";

export function GerenteProvider({ children }) {
  const [pendentes, setPendentes] = useState(clientesPendentesInicial);
  const [clientes, setClientes] = useState(clientesAprovadosInicial);

  // GET /clientes?filtro=...
  const getClientesFiltrados = useCallback(
    (filtro, idGerente) =>
      new Promise((resolve) => {
        try {
          let resultado;

          switch (filtro) {
            case "para_aprovar":
              resultado = pendentes.filter(
                (c) => c.idGerente === idGerente && c.status === "pendente",
              );
              break;

            case "melhores_clientes":
              // Top 3 por saldo — qualquer gerente
              resultado = [...clientes]
                .sort((a, b) => b.saldo - a.saldo)
                .slice(0, 3);
              break;

            case "meus_clientes":
              resultado = clientes
                .filter((c) => c.idGerente === idGerente)
                .sort((a, b) => a.nome.localeCompare(b.nome));
              break;

            default:
              // Sem filtro — todos os clientes com conta
              resultado = [...clientes].sort((a, b) =>
                a.nome.localeCompare(b.nome),
              );
              break;
          }

          resolve({ status: 200, data: resultado });
        } catch {
          resolve({ status: 500, message: "Erro interno do mock." });
        }
      }),
    [pendentes, clientes],
  );

  // GET /cliente/:cpf
  /**
   * Busca um único cliente pelo CPF exato em *todos* os clientes aprovados,
   * independente do gerente. Simula o endpoint real GET /cliente/{cpf}.
   */
  const getClientePorCpf = useCallback(
    (cpf) =>
      new Promise((resolve) => {
        try {
          const encontrado = clientes.find((c) => c.cpf === cpf);
          if (!encontrado) {
            resolve({ status: 404, message: "Cliente não encontrado." });
          } else {
            resolve({ status: 200, data: encontrado });
          }
        } catch {
          resolve({ status: 500, message: "Erro interno do mock." });
        }
      }),
    [clientes],
  );

  // PUT /clientes/:cpf/aprovar
  const aprovarCliente = useCallback(
    (cpf) =>
      new Promise((resolve) => {
        setPendentes((prev) => {
          const idx = prev.findIndex(
            (c) => c.cpf === cpf && c.status === "pendente",
          );

          if (idx === -1) {
            resolve({ status: 404, message: "Cliente não encontrado." });
            return prev;
          }

          const cliente = prev[idx];
          const limite = cliente.salario >= 2000 ? cliente.salario / 2 : 0;
          const conta = String(Math.floor(1000 + Math.random() * 9000));
          const senha = Math.random().toString(36).slice(2, 10);

          // Adicionar à lista de clientes aprovados (Função 2)
          const novoCliente = {
            cpf: cliente.cpf,
            nome: cliente.nome,
            telefone: cliente.telefone,
            email: cliente.email,
            salario: cliente.salario,
            endereco: cliente.endereco,
            cidade: cliente.cidade,
            estado: cliente.estado,
            idGerente: cliente.idGerente,
            conta,
            saldo: 0,
            limite,
            gerente: "",
            gerente_nome: "",
            gerente_email: "",
          };
          setClientes((prevC) => [...prevC, novoCliente]);

          resolve({
            status: 200,
            message: `Cliente aprovado! Conta ${conta} criada. Senha "${senha}" enviada para ${cliente.email}.`,
            data: { conta, senha, limite, email: cliente.email },
          });

          // Atualizar flag no array de pendentes
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            status: "aprovado",
            dataDecisao: toBrasiliaIso(Date.now()),
          };
          return updated;
        });
      }),
    [],
  );

  // PUT /clientes/:cpf/rejeitar
  const rejeitarCliente = useCallback(
    (cpf, motivo) =>
      new Promise((resolve) => {
        setPendentes((prev) => {
          const idx = prev.findIndex(
            (c) => c.cpf === cpf && c.status === "pendente",
          );

          if (idx === -1) {
            resolve({ status: 404, message: "Cliente não encontrado." });
            return prev;
          }

          const cliente = prev[idx];
          resolve({
            status: 200,
            message: `Cliente rejeitado. E-mail enviado para ${cliente.email} com o motivo.`,
          });

          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            status: "rejeitado",
            motivoRejeicao: motivo,
            dataDecisao: toBrasiliaIso(Date.now()),
          };
          return updated;
        });
      }),
    [],
  );

  return (
    <GerenteContext.Provider
      value={{
        pendentes,
        clientes,
        getClientesFiltrados,
        getClientePorCpf,
        aprovarCliente,
        rejeitarCliente,
      }}
    >
      {children}
    </GerenteContext.Provider>
  );
}
