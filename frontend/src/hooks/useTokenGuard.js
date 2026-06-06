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

// intervalo do polling de integridade do localStorage (ms)
const INTERVALO_MS = 1500;

// useTokenGuard | monitora access_token e auth_user e executa logout atômico ao detectar remoção ou adulteração
export function useTokenGuard() {
  const { usuario, limparUsuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // flag em memória: evita múltiplas execuções enquanto a transação de logout está em progresso
  const executando = useRef(false);

  // snapshot dos valores legítimos da sessão atual para detectar adulteração
  const snapshotToken = useRef(null);
  const snapshotUser = useRef(null);

  // refs para valores dinâmicos usados em callbacks estáticos (evita closures stale)
  const pathnameRef = useRef(location.pathname);
  const limparUsuarioRef = useRef(limparUsuario);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);
  useEffect(() => {
    limparUsuarioRef.current = limparUsuario;
  }, [limparUsuario]);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // atualiza snapshot e reseta flag quando uma sessão válida é estabelecida
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const authUser = localStorage.getItem("auth_user");
    if (token && authUser && usuario) {
      snapshotToken.current = token;
      snapshotUser.current = authUser;
      executando.current = false;
    }
  }, [usuario]);

  // verifica se os tokens ainda existem e não foram adulterados
  function verificarIntegridade() {
    if (ROTAS_PUBLICAS.includes(pathnameRef.current)) return;
    if (executando.current) return;
    if (!snapshotToken.current) return;

    const token = localStorage.getItem("access_token");
    const authUser = localStorage.getItem("auth_user");

    const invalido =
      !token ||
      !authUser ||
      token !== snapshotToken.current ||
      authUser !== snapshotUser.current;

    if (invalido) {
      executando.current = true;
      logoutAtomico({
        limparUsuario: limparUsuarioRef.current,
        navigate: navigateRef.current,
      });
    }
  }

  // polling: detecta remoção ou adulteração dos tokens na aba atual
  useEffect(() => {
    const intervalo = setInterval(verificarIntegridade, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  // verifica imediatamente ao trocar de rota (não espera o próximo ciclo do polling)
  useEffect(() => {
    verificarIntegridade();
  }, [location.pathname]);

  // storage event: detecta qualquer mudança nos tokens em outras abas
  useEffect(() => {
    function onStorageChange(e) {
      if (e.key !== "access_token" && e.key !== "auth_user") return;
      if (ROTAS_PUBLICAS.includes(pathnameRef.current)) return;
      if (executando.current) return;

      executando.current = true;
      logoutAtomico({
        limparUsuario: limparUsuarioRef.current,
        navigate: navigateRef.current,
      });
    }

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);
}
