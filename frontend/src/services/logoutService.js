// API
import { API } from "../config";

// logoutAtomico | limpa estado local, remove o refresh token nos cookies e redireciona para login
export async function logoutAtomico({ limparUsuario, navigate }) {
  // limpa access_token e auth_user do localStorage e zera o estado do AuthContext
  limparUsuario();

  try {
    // remove o refresh token do cookie via gateway
    await API.logout();
  } catch {
    // ignora falha de rede - o estado local já foi limpo, o redirecionamento segue
  }

  navigate("/login", { replace: true });
}
