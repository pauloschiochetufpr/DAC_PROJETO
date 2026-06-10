import { Navigate } from "react-router-dom";

// useAuth
import { useAuth } from "../hooks/useAuth";

// normalizarTipoUsuario | converte o campo tipo do usuário para string padronizada
// aceita número (1/2/3) ou string em qualquer caixa ("gerente", "GERENTE", ...)
function normalizarTipoUsuario(tipo) {
  const t = typeof tipo === "string" ? tipo.toLowerCase() : tipo;
  if (t === 1 || t === "1" || t === "administrador") return "ADMINISTRADOR";
  if (t === 2 || t === "2" || t === "gerente") return "GERENTE";
  if (t === 3 || t === "3" || t === "cliente") return "CLIENTE";
  return null;
}

// RotaProtegida | renderiza o elemento apenas se o usuário tiver o cargo permitido, senão redireciona para "/"
export default function RotaProtegida({ element, cargosPermitidos }) {
  const { usuario } = useAuth();
  const role = normalizarTipoUsuario(usuario?.tipo);

  if (!role || !cargosPermitidos.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return element;
}
