import { Routes, Route } from "react-router-dom";
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
import RotaProtegida from  "./lib/RotaProtegida";

// useTokenGuard
import { useTokenGuard } from "./hooks/useTokenGuard";

function normalizarTipoUsuario(tipo) {
  if (tipo === 1 || tipo === "1" || tipo === "administrador") {
    return "ADMINISTRADOR";
  }

  if (tipo === 2 || tipo === "2" || tipo === "gerente") {
    return "GERENTE";
  }

  if (tipo === 3 || tipo === "3" || tipo === "cliente") {
    return "CLIENTE";
  }

  return null;
}

export default function App() {
  useTokenGuard();
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
  }

  return (
    <MainLayout>
      <Routes>
        {/* Globais */}
        <Route path="/" element={HomeCorreto} />

        {/* Gerente */}
        <Route
          path="/consulta_especializada"
          element={<RotaProtegida element={<ConsultaEspecializada />} cargosPermitidos={["GERENTE"]} />}
        />

        {/* Administrador */}
        <Route
          path="/gerenciar_gerentes"
          element={<RotaProtegida element={<GerenciarGerentes />} cargosPermitidos={["ADMINISTRADOR"]} />}
        />

        {/* Cliente */}
        <Route path="/perfil" element={<RotaProtegida element={<Perfil />} cargosPermitidos={["CLIENTE"]} />} />
        <Route path="/operations" element={<RotaProtegida element={<OperationsCli />} cargosPermitidos={["CLIENTE"]} />} />
        <Route path="/extrato" element={<RotaProtegida element={<ExtratoGeral />} cargosPermitidos={["CLIENTE"]} />} />

        {/* Funcionais */}
        <Route path="/login" element={<Login />} />

        {/* Guard global para rotas inexistentes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
