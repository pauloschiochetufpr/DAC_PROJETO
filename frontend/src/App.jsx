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

//mock
import { useBanco } from "./hooks/useBanco";

export default function App() {
  const { usuario } = useBanco();
  const role = usuario?.tipo;
  let HomeCorreto;

  if (role === 1) {
    // Roteamento para Administrador
    HomeCorreto = <HomeAdmin />;
  } else if (role === 2) {
    // Roteamento para Gerente
    HomeCorreto = <HomeGerente />;
  } else if (role === 3) {
    // Roteamento para Cliente
    HomeCorreto = <HomeCliente />;
  }
  
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={usuario ? HomeCorreto : <Login />} />
        <Route
          path="/consulta_especializada"
          element={<ConsultaEspecializada />}
        />
        <Route path="/gerenciar_gerentes" element={<GerenciarGerentes />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/operations" element={<OperationsCli />} />
        <Route path="/extrato" element={<ExtratoGeral />} />

        <Route path="/login" element={<Login />} />
        
        {/* Guard global para rotas inexistentes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
