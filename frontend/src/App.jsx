import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Páginas
import Perfil from "./pages/Perfil";
import HomeGerente from "./pages/HomeGerente";
import HomeCliente from "./pages/HomeCliente";
import HomeAdmin from "./pages/HomeAdmin";
import NotFound from "./pages/NotFound";
import OperationsCli from "./pages/OperationsCli";
import Login from "./pages/Login";
import ConsultaEspecializada from "./pages/ConsultaEspecializada";
import ExtratoGeral from "./components/listas/ExtratoGeral";
import GerenciarGerentes from "./pages/GerenciarGerentes";

// useAuth
import { useAuth } from "./hooks/useAuth";

// RotaProtegida
import RotaProtegida from "./lib/RotaProtegida";

// useTokenGuard
import { useTokenGuard } from "./hooks/useTokenGuard";

// useRefresh
import { useRefresh } from "./hooks/useRefresh";

// aceita número (1/2/3) ou string em qualquer caixa ("gerente", "GERENTE", ...)
function normalizarTipoUsuario(tipo) {
  const t = typeof tipo === "string" ? tipo.toLowerCase() : tipo;

  if (t === 1 || t === "1" || t === "administrador") {
    return "ADMINISTRADOR";
  }

  if (t === 2 || t === "2" || t === "gerente") {
    return "GERENTE";
  }

  if (t === 3 || t === "3" || t === "cliente") {
    return "CLIENTE";
  }

  return null;
}

export default function App() {
  useTokenGuard();
  useRefresh();
  const { usuario } = useAuth();
  const role = normalizarTipoUsuario(usuario?.tipo);
  let HomeCorreto;

  if (role === "ADMINISTRADOR") {
    // Roteamento para Administrador
    HomeCorreto = <HomeAdmin />;
  } else if (role === "GERENTE") {
    // Roteamento para Gerente
    HomeCorreto = <HomeGerente />;
  } else if (role === "CLIENTE") {
    // Roteamento para Cliente
    HomeCorreto = <HomeCliente />;
  } else {
    // Sem sessão ativa - redireciona para login
    HomeCorreto = <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <Routes>
        {/* Globais */}
        <Route path="/" element={HomeCorreto} />

        {/* Gerente */}
        <Route
          path="/consulta_especializada"
          element={
            <RotaProtegida
              element={<ConsultaEspecializada />}
              cargosPermitidos={["GERENTE"]}
            />
          }
        />

        {/* Administrador */}
        <Route
          path="/gerenciar_gerentes"
          element={
            <RotaProtegida
              element={<GerenciarGerentes />}
              cargosPermitidos={["ADMINISTRADOR"]}
            />
          }
        />

        {/* Cliente */}
        <Route
          path="/perfil"
          element={
            <RotaProtegida
              element={<Perfil />}
              cargosPermitidos={["CLIENTE"]}
            />
          }
        />
        <Route
          path="/operations"
          element={
            <RotaProtegida
              element={<OperationsCli />}
              cargosPermitidos={["CLIENTE"]}
            />
          }
        />
        <Route
          path="/extrato"
          element={
            <RotaProtegida
              element={<ExtratoGeral />}
              cargosPermitidos={["CLIENTE"]}
            />
          }
        />

        {/* Funcionais */}
        <Route path="/login" element={<Login />} />

        {/* Guard global para rotas inexistentes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
