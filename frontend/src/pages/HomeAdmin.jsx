// Components
import GerentesLista from "../components/admin/GerentesLista";
import GraficoSaldos from "../components/admin/GraficoSaldos";
import ClientesAdminLista from "../components/admin/ClientesAdminLista";
import BotaoPergaminho from "../components/UI/BotaoPergaminho";

// Lucide
import { Construction } from "lucide-react";
import { UserRoundSearch } from "lucide-react";

// i18n
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../lib/i18n";

export default function HomeAdmin() {
  // i18n
  const { lang } = useLanguage();
  const GenGerBt = t(lang, "HomeAdmin.manage_managers");

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
        {/* Coluna 1 */}
        <div
          className="w-full xl:w-[28%] xl:min-w-[22rem] flex-shrink-0
                     xl:h-full h-[75vh]
                     bg-brandDark/50 backdrop-blur-lg rounded-2xl
                     border border-secundary/70 shadow-dourado-sutil overflow-hidden"
        >
          <GerentesLista />
        </div>

        {/* Coluna 2  */}
        <div className="flex-1 flex flex-col gap-5 xl:h-full min-h-0">
          {/* Gráfico pizza  */}
          <div
            className="w-full flex-shrink-0 xl:h-[13rem] h-fit gap-4 xl:flex-row flex-col flex
                       overflow-hidden"
          >
            <GraficoSaldos />
            <div
              className="flex-1 bg-brandDark/90 backdrop-blur-lg rounded-2xl hidden
                    border border-secundary/70 shadow-black/100 shadow-inner
                    xl:flex flex-col justify-center items-center xl:py-12 xl:text-xl gap-2 text-secundary select-none"
            >
              <Construction className="mb-2" size={70} />
              <h1>{t(lang, "HomeAdmin.more_features_coming")}</h1>
            </div>
          </div>

          {/* Lista de clientes */}
          <div
            className="w-full h-fit xl:flex-1 xl:min-h-0
                       bg-brandDark/50 backdrop-blur-lg rounded-2xl
                       border border-secundary/70 shadow-dourado-sutil overflow-hidden"
          >
            <ClientesAdminLista />
          </div>
        </div>
      </div>
      <div className="w-full h-fit justify-center flex flex-row xl:mt-10">
        <div className="h-[12rem] w-[60%] md:w-[10rem]">
          <BotaoPergaminho
            text={GenGerBt}
            icon={UserRoundSearch}
            ref={"/gerenciar_gerentes"}
          />
        </div>
      </div>
    </div>
  );
}
