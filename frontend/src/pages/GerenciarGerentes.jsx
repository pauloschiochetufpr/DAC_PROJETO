import GerenteForm from "../components/admin/GerenteForm";
import GerentesLista from "../components/admin/GerentesLista";
import { useState } from "react";

export default function GerenciarGerentes() {
  const [gerenteSelecionado, setGerenteSelecionado] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div
      className="relative flex flex-col items-center w-full min-h-screen
                 pt-[12rem] md:pt-[12.5rem] 2xl:pt-[13rem] pb-12 px-2 md:px-4 gap-6"
    >
      {/* Fundo gradiente */}
      <div
        className="absolute top-0 left-0 z-[0] inset-0 w-full h-full
                   bg-gradient-to-b from-brand/30 via-brandDark/60 to-brandDark
                   pointer-events-none"
      />

      {/* Grid principal */}
      <div
        className="relative z-[1] w-full flex flex-col xl:flex-row gap-5
                   xl:h-[74vh] 2xl:h-[76vh]"
      >
        <div
          className="w-full xl:w-[40%] xl:min-w-[22rem] flex-shrink-0
                     xl:h-full h-[75vh]
                     bg-brandDark/50 backdrop-blur-lg rounded-2xl
                     border border-secundary/70 shadow-dourado-sutil overflow-hidden"
        >
          <GerentesLista
            modo="alfabetico"
            onSelect={setGerenteSelecionado}
            selectedId={gerenteSelecionado?.id}
            refreshKey={refreshKey}
          />
        </div>
        <div
          className="w-full h-fit xl:flex-1 xl:min-h-0
                       bg-brandDark/50 backdrop-blur-lg rounded-2xl
                       border border-secundary/70 shadow-dourado-sutil overflow-hidden"
        >
          <GerenteForm
            gerenteSelecionado={gerenteSelecionado}
            onRefresh={handleRefresh}
            onClear={() => setGerenteSelecionado(null)}
          />
        </div>
      </div>
    </div>
  );
}
