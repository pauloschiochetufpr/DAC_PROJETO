import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Páginas
import Perfil from "./pages/Perfil";
import HomeGerente from "./pages/HomeGerente";
import HomeCliente from "./pages/HomeCliente";
import HomeAdmin from "./pages/HomeAdmin";
import NotFound from "./pages/NotFound";
import OperationsCli from "./pages/OperationsCli";
import ConsultaEspecializada from "./pages/ConsultaEspecializada";
import ExtratoGeral from "./components/listas/ExtratoGeral";

export default function App() {
  const role = 3; // Simulação de obtenção do cargo do usuário (1: Administrador, 2: Gerente, 3: Cliente)
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
        <Route path="/" element={HomeCorreto} />

        <Route
          path="/consulta_especializada"
          element={<ConsultaEspecializada />}
        />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/operations" element={<OperationsCli />} />
        <Route path="/extrato" element={<ExtratoGeral />} />

        {/* Guard global para rotas inexistentes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
