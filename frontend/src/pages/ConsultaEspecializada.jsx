// Componentes
import ConsultaClientePanel from "../components/gerente/ConsultaClientePanel";

export default function ConsultaEspecializada() {
  return (
    <div
      className="relative flex flex-col items-center w-full min-h-screen
                  pt-[12rem] md:pt-[14rem] pb-12"
    >
      {/* Fundo gradiente */}
      <div
        className="absolute top-0 left-0 z-[0] inset-0 w-full h-full
                    bg-gradient-to-b from-brand/30 via-brandDark/60 to-brandDark
                    pointer-events-none"
      />

      {/* Painel de consulta */}
      <div
        className="relative z-[1] w-full max-w-4xl
                    bg-brand/30 backdrop-blur-lg sm:rounded-2xl
                    border border-secundary/70 shadow-dourado-sutil
                    "
      >
        <div className="h-full w-full px-2 md:px-4 sm:rounded-2xl overflow-hidden relative">
          <ConsultaClientePanel />
        </div>
      </div>
    </div>
  );
}
