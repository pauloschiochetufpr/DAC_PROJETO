import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Guard global para rotas inexistentes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}
