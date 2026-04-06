import { useState, useCallback } from "react";
import { AuthContext } from "./auth.context";

import { authMock } from "../mocks/authMock";
import { clientesMock } from "../mocks/clientesMock";

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState(authMock);
  const [clientes, setClientes] = useState(clientesMock);

  const [usuario, setUsuario] = useState(null);

  // 🔹 LOGIN
  const login = useCallback(
    (email, senha) => {
      return new Promise((resolve) => {
        const cliente = clientes.find((c) => c.email === email);

        if (!cliente) {
          resolve({ status: 404, message: "Usuário não encontrado." });
          return;
        }

        if (cliente.status === "pendente") {
          resolve({
            status: 403,
            message: "Cadastro ainda em análise.",
          });
          return;
        }

        if (cliente.status === "rejeitado") {
          resolve({
            status: 403,
            message: "Cadastro rejeitado.",
          });
          return;
        }

        const auth = usuarios.find((u) => u.clienteId === cliente.id);

        if (!auth || auth.senha !== senha) {
          resolve({
            status: 401,
            message: "Credenciais inválidas.",
          });
          return;
        }

        setUsuario({
          ...cliente,
          ...auth,
        });

        resolve({
          status: 200,
          message: "Login realizado com sucesso.",
        });
      });
    },
    [usuarios, clientes],
  );

  // 🔹 LOGOUT
  const logout = useCallback(() => {
    setUsuario(null);
  }, []);

  // 🔹 CADASTRO (autocadastro)
  const cadastrar = useCallback(
    (dados) => {
      return new Promise((resolve) => {
        const existente = clientes.find((c) => c.cpf === dados.cpf);

        if (existente) {
          if (existente.status === "pendente") {
            resolve({
              status: 400,
              message: "Cadastro já está em análise.",
            });
            return;
          }

          if (existente.status === "aprovado") {
            resolve({
              status: 400,
              message: "Cliente já possui conta.",
            });
            return;
          }

          // rejeitado → reenvio
          if (existente.status === "rejeitado") {
            setClientes((prev) =>
              prev.map((c) =>
                c.cpf === dados.cpf
                  ? {
                      ...c,
                      ...dados,
                      status: "pendente",
                    }
                  : c,
              ),
            );

            resolve({
              status: 200,
              message: "Cadastro reenviado para análise.",
            });
            return;
          }
        }

        // 🔹 novo cliente
        const novoCliente = {
          id: crypto.randomUUID(),
          ...dados,
          status: "pendente",
          gerenteId: null, // depois você implementa auto-assign
        };
        console.log("Novo cliente criado:", novoCliente);
        setClientes((prev) => {
          const atualizado = [...prev, novoCliente];
          console.log("Lista de clientes atualizada:", atualizado);
          return atualizado;
        });

        resolve({
          status: 200,
          message: "Cadastro realizado com sucesso.",
        });
      });
    },
    [clientes],
  );

  const atualizarUsuario = useCallback((novoUsuario) => {
    setUsuario(novoUsuario);

    setClientes((prev) =>
      prev.map((c) => (c.id === novoUsuario.id ? { ...c, ...novoUsuario } : c)),
    );
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        clientes,
        login,
        logout,
        cadastrar,
        atualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
