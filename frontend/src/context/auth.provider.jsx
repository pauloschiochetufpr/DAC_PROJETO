import { useState, useCallback, useRef } from "react";

// AuthContext
import { AuthContext } from "./auth.context";

// Chave usada para persistir o usuário autenticado no localStorage
const AUTH_USER_KEY = "auth_user";

// lerUsuarioSalvo | tenta ler e parsear o usuário salvo no localStorage
function lerUsuarioSalvo() {
  try {
    const salvo = localStorage.getItem(AUTH_USER_KEY);
    return salvo ? JSON.parse(salvo) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // Usuário autenticado: { tipo, nome, cpf, email }
  const [usuario, setUsuario] = useState(() => lerUsuarioSalvo());

  // snapshot do access_token atual; compartilhado entre useTokenGuard e useRefresh
  const tokenSnapshotRef = useRef(null);

  // salvarUsuario | persiste o usuário autenticado no state e no localStorage
  const salvarUsuario = useCallback((dadosUsuario) => {
    setUsuario(dadosUsuario);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(dadosUsuario));
  }, []);

  // limparUsuario | remove o usuário autenticado do state e do localStorage
  const limparUsuario = useCallback(() => {
    setUsuario(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem("access_token");
    localStorage.removeItem("access_token_exp");
    tokenSnapshotRef.current = null;
  }, []);

  // atualizarTokenSnapshot | atualiza o snapshot do access_token sem causar re-render
  const atualizarTokenSnapshot = useCallback((novoToken) => {
    tokenSnapshotRef.current = novoToken;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        salvarUsuario,
        limparUsuario,
        tokenSnapshotRef,
        atualizarTokenSnapshot,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
