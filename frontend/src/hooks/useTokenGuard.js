// react
import { useEffect, useRef } from "react";

// react-router-dom
import { useNavigate, useLocation } from "react-router-dom";

// hooks
import { useAuth } from "./useAuth";

// services
import { logoutAtomico } from "../services/logoutService";

// rotas acessíveis sem token
const ROTAS_PUBLICAS = ["/login"];

// useTokenGuard | escuta a existência do access_token e do auth_user e executa logout atômico quando qualquer um sumir
export function useTokenGuard() {
  const { usuario, limparUsuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // flag em memória: evita múltiplas execuções enquanto a transação de logout está em progresso
  const executando = useRef(false);

  // reseta a flag quando uma sessão ativa é restaurada (ex: após novo login)
  useEffect(() => {
    if (
      localStorage.getItem("access_token") &&
      localStorage.getItem("auth_user") &&
      usuario
    ) {
      executando.current = false;
    }
  }, [usuario]);

  // verifica o token a cada troca de rota
  useEffect(() => {
    if (ROTAS_PUBLICAS.includes(location.pathname)) return;
    if (executando.current) return;

    const token = localStorage.getItem("access_token");
    const authUser = localStorage.getItem("auth_user");
    if (!token || !authUser) {
      executando.current = true;
      logoutAtomico({ limparUsuario, navigate });
    }
  }, [location.pathname, usuario]);

  // escuta a remoção do token em outras abas do navegador (storage event é cross-tab)
  useEffect(() => {
    function onStorageChange(e) {
      if (e.key !== "access_token" && e.key !== "auth_user") return;
      if (e.newValue !== null) return;
      if (ROTAS_PUBLICAS.includes(location.pathname)) return;
      if (executando.current) return;

      executando.current = true;
      logoutAtomico({ limparUsuario, navigate });
    }

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [location.pathname, limparUsuario, navigate]);
}
