import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Home from "./pages/HomeGerente";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

{
  /* O route guard do Home é mais robusto e visa detectar qual o tipo de usuário toda vez
  que for acessar a página, afin de rotear para a rota correta
  Assim, a página que mais compartilha entre cargos diferentes se mantém otimizada por só ter
  uma validação inicial, ao invés de multiplás validações em tempo de exibição */
}
export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/perfil" element={<Perfil />} />

        {/* Guard global para rotas inexistentes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
