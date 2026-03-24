import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import HomeGerente from "./pages/HomeGerente";
import HomeCliente from "./pages/HomeCliente";
import HomeAdmin from "./pages/HomeAdmin";
import NotFound from "./pages/NotFound";

{
  /* O route guard do Home é mais robusto e visa detectar qual o tipo de usuário toda vez
  que for acessar a página, afin de rotear para a rota correta
  Assim, a página que mais compartilha entre cargos diferentes se mantém otimizada por só ter
  uma validação inicial, ao invés de multiplás validações em tempo de exibição */
}

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

        {/* Guard global para rotas inexistentes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
