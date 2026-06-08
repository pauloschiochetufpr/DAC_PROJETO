import { Navigate } from "react-router-dom";

// useAuth
import { useAuth } from "../hooks/useAuth";

// normalizarTipoUsuario | converte o campo tipo do usuário para string padronizada
function normalizarTipoUsuario(tipo) {
  if (tipo === 1 || tipo === "1" || tipo === "administrador")
    return "ADMINISTRADOR";
  if (tipo === 2 || tipo === "2" || tipo === "gerente") return "GERENTE";
  if (tipo === 3 || tipo === "3" || tipo === "cliente") return "CLIENTE";
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
