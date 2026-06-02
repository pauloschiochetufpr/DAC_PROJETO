import { useState, useCallback } from "react";

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
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, salvarUsuario, limparUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}
