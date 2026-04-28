import React, { useMemo, useState } from "react";

// Hook e utilitários
import { useBanco } from "../../hooks/useBanco";
import { formatarData } from "../../lib/dataUtils";

// SVG's
import WaveSimpleRedReverse from "../WaveSimpleRedReverse";

// i18n
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../lib/i18n";

// Lucide
import {
  ArrowRightFromLine,
  BanknoteArrowUp,
  BanknoteArrowDown,
  HandCoins,
  NotepadTextDashed,
} from "lucide-react";

// Formatadores
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const getValorPrefixo = (tipo, origem, conta) => {
  if (tipo === "saque") return "-";
  if (tipo === "deposito") return "+";
  if (tipo === "transferencia") return origem === conta ? "-" : "+";
  return "";
};

const getValorClasseTexto = (tipo, origem, conta) => {
  if (tipo === "saque") return "text-red-600";
  if (tipo === "deposito") return "text-green-600";
  if (tipo === "transferencia")
    return origem === conta ? "text-red-600" : "text-green-600";
  return "text-black";
};

const getIconeTipo = (tipo) => {
  const t = String(tipo || "").toLowerCase();
  if (t === "saque")
    return <BanknoteArrowUp size={24} className="text-secundary" />;
  if (t === "deposito")
    return <BanknoteArrowDown size={24} className="text-secundary" />;
  if (t === "transferencia")
    return <HandCoins size={24} className="text-secundary" />;
};

// Itens carregados por batch
const BATCH = 10;

// Corte dos ultimos 30 dias, fixo no carregamento do modulo
const CORTE_30_DIAS = Date.now() - 30 * 24 * 60 * 60 * 1000;

export default function MiniExtratoMob({ showInfo }) {
  const { lang } = useLanguage();
  const { movimentacoes, conta } = useBanco();
  const masked = "R$ --,--";

  // Filtra ultimos 30 dias
  const transacoes = useMemo(
    () =>
      movimentacoes.filter((m) => new Date(m.data).getTime() >= CORTE_30_DIAS),
    [movimentacoes],
  );

  const [visiveis, setVisiveis] = useState(BATCH);

  const itens = transacoes.slice(0, visiveis);
  const temMais = visiveis < transacoes.length;

  const carregarMais = () =>
    setVisiveis((prev) => Math.min(prev + BATCH, transacoes.length));

  return (
    <div className="h-fit w-full bg-brand/40 flex flex-col border-t-4 border-b-4 border-secundary">
      {/* Cabeçalho */}
      <div className="w-full h-[6rem] p-3 flex justify-center items-center relative shadow-lg shadow-black/40">
        <div className="absolute left-0 top-0 w-full h-full bg-white/[0.05] z-[14]"></div>
        <div className="absolute left-0 top-0 w-full h-full flex flex-row z-[13]">
          <div className="w-[50%] h-full bg-gradient-to-r from-transparent to-white/[0.14] z-[13]"></div>
          <div className="flex-1 bg-gradient-to-l from-transparent to-white/[0.14] z-[13]"></div>
        </div>
        <div className="absolute left-0 top-0 w-full h-full flex flex-row z-[13]">
          <div className="w-[50%] h-full bg-gradient-to-l from-transparent to-black/[0.32] z-[13]"></div>
          <div className="flex-1 bg-gradient-to-r from-transparent to-black/[0.32] z-[13]"></div>
        </div>
        <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-t from-transparent to-black/40 z-[12]"></div>
        <WaveSimpleRedReverse className="z-[1]" />
        <div
          className="font-orienta font-semibold text-3xl z-[20] px-4 py-2 bg-black/60 rounded-md
                shadow-inner shadow-black/80"
        >
          {t(lang, "MiniStatement.title")}
        </div>
      </div>

      {/* Lista de transações */}
      <div className="w-full h-fit bg-contrast flex flex-col font-inter text-xs select-none justify-center items-center">
        {itens.length === 0 ? (
          <div
            className="py-8 text-center text-wrap text-base  text-secundary select-none px-2  bg-black/40
          rounded-md shadow-black/50 shadow-inner my-5 mx-10"
          >
            <NotepadTextDashed size={60} className="mx-auto mb-4" />
            {t(lang, "MiniStatement.empty")}
          </div>
        ) : (
          itens.map((item) => {
            const { dataFormatada, horario } = formatarData(item.data);
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 w-full border-black/15 border-b py-2 px-2"
              >
                {/* Ícone + origem/tipo */}
                <div className="flex flex-row w-full gap-4">
                  <div className="flex h-full w-fit items-center justify-center pl-2">
                    <div
                      className="bg-secundary/15 text-secundary h-[2.5rem] w-[2.5rem] rounded-md
                      flex items-center justify-center font-semibold border border-secundary/30"
                    >
                      {getIconeTipo(item.tipo)}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 items-start justify-center pt-1.5 text-zinc-800">
                    <div className="flex flex-row h-[50%] w-full gap-2">
                      <h1>{item.origem}</h1>
                      <ArrowRightFromLine size={16} />
                      <h1>{item.destino}</h1>
                    </div>
                    <div className="flex flex-row flex-1 font-istok-web text-zinc-500">
                      <h1>{t(lang, `MiniStatement.types.${item.tipo}`)}</h1>
                    </div>
                  </div>
                </div>

                {/* Horário e valor */}
                <div className="flex flex-row justify-between px-2 pb-1 text-contrastDark">
                  <div className="flex flex-row w-fit h-full justify-center items-center gap-2">
                    <h1>{horario}</h1> <h1>|</h1> <h1>{dataFormatada}</h1>
                  </div>
                  <div className="flex flex-row w-fit h-full pr-2 justify-center items-center">
                    <div
                      className={`flex flex-row bg-white rounded-sm py-1.5 px-2 min-w-24 w-fit h-fit
                        items-center justify-center gap-[3px] ${getValorClasseTexto(item.tipo, item.origem, conta)}`}
                    >
                      <span className="w-3 text-center">
                        {getValorPrefixo(item.tipo, item.origem, conta)}
                      </span>
                      {showInfo ? (
                        <p>{currencyFormatter.format(item.valor)}</p>
                      ) : (
                        masked
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Botão carregar mais */}
        {temMais && (
          <button
            onClick={carregarMais}
            className="w-[80%] my-3 bg-secundaryDark/10 backdrop-blur-md py-3 border-secundary border rounded-sm
            text-xs font-semibold text-secundary active:text-white 
            active:bg-secundary transition-colors duration-75"
          >
            {t(lang, "MiniStatement.actions.loadMore")}
          </button>
        )}
      </div>
    </div>
  );
}
