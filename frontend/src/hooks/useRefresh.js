// react
import { useEffect, useRef } from "react";

// react-router-dom
import { useNavigate, useLocation } from "react-router-dom";

// hooks
import { useAuth } from "./useAuth";

// API
import { API } from "../config";

// services
import { logoutAtomico } from "../services/logoutService";

// tempo de vida do access token (deve corresponder a jwt.expiration no auth-service)
const TOKEN_DURATION_MS = 600_000; // 10 minutos

// percentual mínimo de vida restante para acionar o refresh
const LIMIAR_REFRESH = 0.15; // 15% = 90 segundos

// intervalo de polling do monitor
const INTERVALO_MS = 10_000; // 10 segundos

// rotas que dispensam monitoramento
const ROTAS_PUBLICAS = ["/login"];

// useRefresh | monitora o tempo de vida do access token e efetua refresh ou logout conforme necessário
export function useRefresh() {
  const { limparUsuario, atualizarTokenSnapshot } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // flag: evita execuções concorrentes durante refresh ou logout
  const executando = useRef(false);

  // refs para valores dinâmicos usados no callback do setInterval (evita closures stale)
  const pathnameRef = useRef(location.pathname);
  const limparUsuarioRef = useRef(limparUsuario);
  const navigateRef = useRef(navigate);
  const atualizarSnapshotRef = useRef(atualizarTokenSnapshot);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);
  useEffect(() => {
    limparUsuarioRef.current = limparUsuario;
  }, [limparUsuario]);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  useEffect(() => {
    atualizarSnapshotRef.current = atualizarTokenSnapshot;
  }, [atualizarTokenSnapshot]);

  // msParaHMS | converte milissegundos em string HH:MM:SS
  function msParaHMS(ms) {
    const totalSeg = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeg / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((totalSeg % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeg % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  // verificarToken | avalia o tempo de vida restante e age conforme o estado
  async function verificarToken() {
    if (ROTAS_PUBLICAS.includes(pathnameRef.current)) return;
    if (executando.current) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const expRaw = localStorage.getItem("access_token_exp");
    if (!expRaw) return;

    const exp = parseInt(expRaw, 10);
    if (isNaN(exp)) return;

    const restante = exp - Date.now();

    if (restante <= 0) {
      console.warn(
        `[useRefresh] Token INVÁLIDO/EXPIRADO — restante: ${restante}ms (${msParaHMS(restante)}) — iniciando logout`,
      );
      executando.current = true;
      await logoutAtomico({
        limparUsuario: limparUsuarioRef.current,
        navigate: navigateRef.current,
      });
      return;
    }

    const limiarMs = TOKEN_DURATION_MS * LIMIAR_REFRESH; // 90 000 ms

    if (restante > limiarMs) {
      console.log(
        `[useRefresh] Token VÁLIDO — restante: ${restante}ms (${msParaHMS(restante)}) — próxima verificação em ${INTERVALO_MS / 1000}s`,
      );
      return;
    }

    console.warn(
      `[useRefresh] Token PRÓXIMO DO VENCIMENTO — restante: ${restante}ms (${msParaHMS(restante)}) — iniciando refresh`,
    );

    // token com menos de 15% de vida — tenta refresh
    executando.current = true;
    try {
      const response = await API.refresh();
      const novoToken = response.data?.access_token;
      if (!novoToken) throw new Error("Refresh sem token");

      // atualiza token e exp no localStorage
      localStorage.setItem("access_token", novoToken);
      localStorage.setItem(
        "access_token_exp",
        String(Date.now() + TOKEN_DURATION_MS),
      );

      // atualiza snapshot no AuthContext de forma síncrona, antes do próximo ciclo do useTokenGuard
      atualizarSnapshotRef.current(novoToken);

      console.log(
        `[useRefresh] Refresh CONCLUÍDO — novo token válido por ${TOKEN_DURATION_MS}ms (${msParaHMS(TOKEN_DURATION_MS)})`,
      );

      executando.current = false;
    } catch (err) {
      console.error(
        `[useRefresh] Refresh FALHOU — erro: ${err?.message ?? err} — iniciando logout`,
      );
      // qualquer falha no refresh dispara logout completo
      await logoutAtomico({
        limparUsuario: limparUsuarioRef.current,
        navigate: navigateRef.current,
      });
    }
  }

  // polling contínuo e atemporal — ativo durante toda a vida do componente raiz
  // verificarToken usa refs estáveis internamente; não precisa de re-registro no deps array
  useEffect(() => {
    const intervalo = setInterval(verificarToken, INTERVALO_MS);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // verificação imediata na abertura da aba; evita janela de até 10s com token expirado
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { verificarToken(); }, []);
}
