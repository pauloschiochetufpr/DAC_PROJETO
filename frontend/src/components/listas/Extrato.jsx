import React from "react";
import { Link } from "react-router-dom";

// Mock's
import { useBanco } from "../../hooks/useBanco";
import { formatarData } from "../../lib/dataUtils";

// Lucide
import {
  ArrowRightFromLine,
  BanknoteArrowUp,
  BanknoteArrowDown,
  HandCoins,
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
  const tipoNormalizado = String(tipo || "").toLowerCase();
  if (tipoNormalizado === "saque") {
    return <BanknoteArrowUp size={24} className="text-secundary" />;
  }
  if (tipoNormalizado === "deposito") {
    return <BanknoteArrowDown size={24} className="text-secundary" />;
  }
  if (tipoNormalizado === "transferencia") {
    return <HandCoins size={24} className="text-secundary" />;
  }
};

export default function Extrato({ showInfo }) {
  // Mock renderizado
  const { movimentacoes, conta } = useBanco();

  // Conversões e mascaras
  const masked = "R$ --,--";

  return (
    <div
      className="bg-brand h-full xl:h-[140%] 2xl:h-[180%] w-full xl:w-full scale-x-90 2xl:scale-x-100
      flex flex-col font-inter
      shadow-2xl shadow-black/40
     items-center justify-center relative border-secundaryDark/70 border-r-[1px] border-l-[1px] select-none"
    >
      {/* Gradientes para os cantos | Textura papel central */}
      <div className="w-[30%] h-full right-0 top-0 absolute bg-gradient-to-r from-transparent to-brandDark/50"></div>
      <div className="w-[30%] h-full left-0 top-0 absolute bg-gradient-to-l from-transparent to-brandDark/50"></div>
      <div className="w-full h-[55%] left-0 top-0 absolute bg-gradient-to-t from-transparent to-brandDark/70"></div>
      <div className="w-full h-[50%] left-0 bottom-0 absolute bg-gradient-to-b from-transparent to-brandDark/50"></div>

      {/* Rolos */}
      <div
        className=" bg-brand h-[6rem] w-[120%] 2xl:w-[115%] absolute -top-2
                rounded-r-[47px] rounded-l-[47px] overflow-hidden"
      >
        <div className="parchment-roll-edge parchment-roll-edge-left"></div>
        <div className="parchment-roll-edge parchment-roll-edge-right"></div>
        <div className="w-[25%] h-full right-0 top-0 absolute bg-gradient-to-r from-transparent to-brandDark/60"></div>
        <div className="w-[25%] h-full left-0 top-0 absolute bg-gradient-to-l from-transparent to-brandDark/60"></div>
        <div className="w-full h-[60%] left-0 bottom-0 absolute bg-gradient-to-b from-transparent to-brandDark/60"></div>
      </div>
      <div
        className=" bg-brand h-[6rem] w-[120%] 2xl:w-[115%] absolute -bottom-2
                rounded-r-[47px] rounded-l-[47px] overflow-hidden"
      >
        <div className="parchment-roll-edge parchment-roll-edge-left"></div>
        <div className="parchment-roll-edge parchment-roll-edge-right"></div>
        <div className="w-[25%] h-full right-0 top-0 absolute bg-gradient-to-r from-transparent to-brandDark/60"></div>
        <div className="w-[25%] h-full left-0 top-0 absolute bg-gradient-to-l from-transparent to-brandDark/60"></div>
        <div className="w-full h-[60%] left-0 bottom-0 absolute bg-gradient-to-b from-transparent to-brandDark/60"></div>
      </div>

      {/* Lista interna */}
      <div className="h-[5px] w-full bg-secundary"></div>
      <div className="h-[63%] 2xl:h-[64%] w-[75%] 2xl:w-[62%] min-h-0 flex flex-row items-start justify-start overflow-hidden relative">
        <div className="h-full w-[5px] bg-secundary z-[-10]"></div>
        <div
          className="h-full w-full flex-1 min-h-0 bg-lightDark relative
                    "
        >
          <div
            className="z-[5] bg-gradient-to-t from-transparent to-red-800/80 w-full h-[40%]
                          absolute top-0 left-0"
          ></div>
          <div
            className="z-[5] bg-gradient-to-b from-transparent to-red-800/80 w-full h-[40%]
                          absolute bottom-0 left-0"
          ></div>
          <div
            className="z-[5] bg-gradient-to-l from-transparent to-red-800/80 w-[30%] h-full
                          absolute bottom-0 left-0"
          ></div>
          <div
            className="z-[5] bg-gradient-to-r from-transparent to-red-800/80 w-[30%] h-full
                          absolute bottom-0 right-0"
          ></div>
          <div
            className="extrato-scroll h-full w-full overflow-x-hidden overflow-y-auto text-xs
          z-[15] absolute md:overscroll-none"
          >
            {movimentacoes.map((item) => {
              const { dataFormatada, horario } = formatarData(item.data);
              return (
                <Link
                  key={item.id}
                  className="flex flex-col gap-3 max-h-32 h-[6rem] w-full border-black/15 border-b py-2 px-2
                  cursor-pointer group"
                >
                  <div className="flex flex-row h-[70%] w-full gap-4 relative">
                    <div className="flex h-full w-fit items-center justify-center pl-2">
                      <div
                        className="bg-secundary/25 text-secundary h-[2.5rem] w-[2.5rem] rounded-md
                       flex items-center justify-center font-semibold"
                      >
                        {getIconeTipo(item.tipo)}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 items-start justify-center pt-1.5">
                      <div className="flex flex-row h-[50%] w-full gap-2">
                        <h1>{item.origem}</h1>
                        <ArrowRightFromLine size={16} />
                        <h1>{item.destino}</h1>
                      </div>
                      <div className="flex flex-row flex-1 font-istok-web">
                        <h1>{item.tipo}</h1>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-row justify-between px-2">
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
                </Link>
              );
            })}
          </div>
        </div>
        <div className="h-full w-[5px] bg-secundary z-[-10]"></div>
      </div>
      <div className="h-[5px] w-full bg-secundary"></div>
    </div>
  );
}
