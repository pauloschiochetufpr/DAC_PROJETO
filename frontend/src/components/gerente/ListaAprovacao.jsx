// Componentes
import CardAprovacao from "./CardAprovacao";

// SVG's
import WaveSimpleRed from "../WaveSimpleRed";

//i18n
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../lib/i18n";

// Lucide
import { Bug, TicketX } from "lucide-react";

export default function ListaAprovacao({
  clientes,
  loading,
  erro,
  feedback,
  onAprovar,
  onRejeitar,
}) {
  const { lang } = useLanguage();

  // Formatar de moeda
  const fmtBRL = (v) =>
    v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <div className="flex flex-col w-full h-full gap-5">
      {/* Cabeçalho da seção */}
      <div className="rounded-t-2xl w-full h-fit shadow-md shadow-black/40 relative">
        <div
          className="w-full h-[4.5rem] relative rounded-t-2xl overflow-hidden flex items-center justify-center
                      shadow-inner shadow-black/90"
        >
          <div className="absolute left-0 top-0 w-full h-full bg-white/[0.05] z-[14]"></div>
          <div className="absolute left-0 top-0 w-full h-full flex flex-row z-[13]">
            <div className=" w-[50%] h-full bg-gradient-to-r from-transparent to-white/[0.14] z-[13]"></div>
            <div className=" flex-1 bg-gradient-to-l from-transparent to-white/[0.14] z-[13]"></div>
          </div>
          <div className="absolute left-0 top-0 w-full h-full flex flex-row z-[13]">
            <div className=" w-[50%] h-full bg-gradient-to-l from-transparent to-black/[0.32] z-[13]"></div>
            <div className=" flex-1 bg-gradient-to-r from-transparent to-black/[0.32] z-[13]"></div>
          </div>
          <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-t from-transparent to-black/40 z-[12]"></div>
          <WaveSimpleRed className="z-[-3]" />
          <div
            className="font-orienta text-xl md:text-3xl 2xl:text-3xl xl:text-2xl text-secundary
                      select-none text-center z-[19] px-5 py-2 pb-3 bg-black/50 rounded-md
                      shadow-inner shadow-black"
          >
            {t(lang, "ClientesGerenteLista.title")}
          </div>
        </div>
      </div>

      {loading && (
        <p
          className="font-inter text-center text-base md:text-xl
         pb-8 md:pt-40  flex flex-col items-center justify-center gap-2 w-full"
        >
          Carregando...
        </p>
      )}

      {/* Feedback de ação */}
      {feedback && (
        <div
          className={`my-4 px-4 py-2 rounded-sm text-sm font-inter font-medium text-center transition-all z-[200]
            absolute bottom-[85%] select-none
            ${feedback.tipo === "sucesso" ? "bg-green-800/100 text-green-200" : "bg-red-800/100 text-red-200"}`}
        >
          {feedback.msg}
        </div>
      )}

      {erro && (
        <p
          className="text-red-400 font-inter text-center text-base md:text-xl
         pb-8 md:pt-40  flex flex-col items-center justify-center gap-2 w-full"
        >
          <Bug size={65} className="inline-block mr-2 select-none" />
          {erro}
        </p>
      )}

      {!loading && !erro && clientes?.length === 0 && (
        <p
          className="text-contrast font-inter text-center text-base md:text-xl
        pb-8 md:pt-40 flex flex-col items-center justify-center gap-2 w-full select-none"
        >
          <TicketX size={65} className="inline-block" />
          {t(lang, "ClientesGerenteLista.no_pending")}
        </p>
      )}

      {/* Tabela de pendentes */}
      {!loading && !erro && clientes?.length > 0 && (
        <div className="h-full w-full pb-3 px-3">
          <div
            className="overflow-hidden h-full w-full rounded-xl border border-secundaryDark/60
                      scrollbar-thin scrollbar-thumb-secundary scrollbar-track-brandDark md:overscroll-none
                      shadow-inner shadow-black/20"
          >
            {/* Corpo */}
            <div className="overflow-x-hidden overflow-y-scroll py-3 h-full flex flex-col gap-2 px-2">
              {clientes.map((cliente) => (
                <CardAprovacao
                  key={cliente.cpf}
                  cliente={cliente}
                  fmtBRL={fmtBRL}
                  onAprovar={onAprovar}
                  onRejeitar={onRejeitar}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
