// Componentes do gerente
import ListaAprovacao from "../components/gerente/ListaAprovacao";
import ListaClientes from "../components/gerente/ListaClientes";

// ID do gerente logado (simulação simples)
import { GERENTE_ID } from "../mocks/gerenteMockData";

export default function HomeGerente() {
  return (
    <div
      className="relative flex flex-col items-center w-full min-h-screen
                  pt-[12rem] md:pt-[14rem] pb-12"
    >
      {/* Fundo gradiente */}
      <div
        className=" absolute top-0 left-0 z-[0] inset-0 w-full h-full
                    bg-gradient-to-b from-brand/30 via-brandDark/60 to-brandDark
                    pointer-events-none"
      />

      {/* Container principal | divide em 2 para CELL */}
      <div
        className="relative z-[1] w-full xl:max-h-[68vh] 2xl:max-h-[73vh] md:px-4 px-2
                    flex flex-col xl:flex-row gap-8 xl:gap-5"
      >
        {/* Aprovação de Autocadastros */}
        <div
          className="xl:h-[68vh] 2xl:h-[73vh] w-full xl:min-w-[30%] xl:w-[30%] 2xl:min-w-[30%] 2xl:w-[30%]
           bg-brandDark/50 backdrop-blur-lg
                      rounded-2xl border border-secundary/70 shadow-dourado-sutil
                      "
        >
          <ListaAprovacao idGerente={GERENTE_ID} />
        </div>

        {/* Consulta de Clientes */}
        <div
          className="w-full xl:h-[68vh] 2xl:h-[73vh] bg-brandDark/50 backdrop-blur-lg
                      rounded-2xl border border-secundary/70 shadow-dourado-sutil
                      "
        >
          <ListaClientes idGerente={GERENTE_ID} />
        </div>
      </div>
    </div>
  );
}
