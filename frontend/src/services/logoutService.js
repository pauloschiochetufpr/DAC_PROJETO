// API
import { API } from "../config";

// logoutAtomico | limpa estado local, remove o refresh token nos cookies e redireciona para login
export async function logoutAtomico({ limparUsuario, navigate }) {
  // limpa access_token e auth_user do localStorage e zera o estado do AuthContext
  limparUsuario();

  // quantidade máxima de tentativas de remoção do refresh token
  const MAX_TENTATIVAS = 3;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      // remove o refresh token do cookie via gateway
      await API.logout();
      break;
    } catch {
      if (tentativa === MAX_TENTATIVAS) {
        // esgotou as tentativas - estado local já foi limpo, o redirecionamento segue
      }
    }
  }

  navigate("/login", { replace: true });
}
