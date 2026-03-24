import React from "react";
import { useState, useEffect } from "react";
import { MessageCircleMore } from "lucide-react";

export default function Credito() {
  const [percentual, setPercentual] = useState(40); // valor numérico (40%->70%)

  useEffect(() => {
    const min = 40;
    const max = 70;
    const interval = setInterval(() => {
      const next = Math.floor(Math.random() * (max - min + 1)) + min;
      setPercentual(next);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function getColors(p) {
    const pct = Math.max(0, Math.min(100, p));
    if (pct <= 20) {
      return {
        base: "#7f0000",
        grad1: "rgba(127,0,0,0.25)",
        grad2: "rgba(127,0,0,0.18)",
        grad3: "rgba(127,0,0,0.12)",
      };
    }
    if (pct <= 40) {
      return {
        base: "#ff4500",
        grad1: "rgba(255,69,0,0.25)",
        grad2: "rgba(255,69,0,0.18)",
        grad3: "rgba(255,69,0,0.12)",
      };
    }
    if (pct <= 60) {
      return {
        base: "#ff9800",
        grad1: "rgba(255,152,0,0.25)",
        grad2: "rgba(255,152,0,0.18)",
        grad3: "rgba(255,152,0,0.12)",
      };
    }
    if (pct <= 80) {
      return {
        base: "#66bb6a",
        grad1: "rgba(102,187,106,0.25)",
        grad2: "rgba(102,187,106,0.18)",
        grad3: "rgba(102,187,106,0.12)",
      };
    }
    return {
      base: "#7CFC00",
      grad1: "rgba(124,252,0,0.25)",
      grad2: "rgba(124,252,0,0.18)",
      grad3: "rgba(124,252,0,0.12)",
    };
  }

  const color = getColors(percentual);

  function getLabel(p) {
    const pct = Math.max(0, Math.min(100, p));
    if (pct <= 20) return "Sensei Muito Triste Grau 1";
    if (pct <= 40) return "Sensei Triste Grau 2";
    if (pct <= 60) return "Sensei Neutro Grau 3";
    if (pct <= 80) return "Sensei Satisfeito Grau 4";
    return "Sensei Muito Satisfeito Grau 5";
  }

  const label = getLabel(percentual);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="h-[90%] w-[90%] flex flex-col xl:flex-row bg-brandDark/70 border-secundaryDark border-[2px]">
        <div
          className="w-full p-4 bg-white xl:h-full h-[33.333%] shadow-inner shadow-black/50
        flex items-center justify-center relative select-none"
        >
          <div className="w-[40%] h-full right-0 top-0 absolute bg-gradient-to-r from-transparent to-amber-600/50"></div>
          <div className="w-[40%] h-full left-0 top-0 absolute bg-gradient-to-l from-transparent to-amber-600/50"></div>
          <div className="w-full h-[20%] left-0 top-0 absolute bg-gradient-to-t from-transparent to-amber-600/30"></div>
          <div className="w-full h-[20%] left-0 bottom-0 absolute bg-gradient-to-b from-transparent to-amber-600/30"></div>
          <div className="text-center px-4 w-full h-full flex flex-col items-center justify-center">
            <div
              className="font-istok-web font-black text-2xl xl:text-4xl"
              style={{ color: color.base }}
            >
              {label}
            </div>
            <div className="hidden xl:block mt-2 text-sm text-gray-700/80">
              SVG FULL (placeholder)
            </div>
            <div className="block xl:hidden mt-2 text-sm text-gray-700/80">
              SVG Quadrado Miniatura (placeholder)
            </div>
          </div>
        </div>

        <div className="w-full xl:w-10/12 xl:h-full h-[63.666%] flex flex-col">
          {/* parte direita superior */}
          <div className="flex-1 h-full p-4 pt-8 justify-start items-center flex flex-col gap-8 relative">
            <div className="font-inter text-lg text-center max-w-[14rem] sm:text-3xl sm:max-w-[30rem] xl:max-w-[14rem] xl:text-lg">
              Entre em contato com seu gerente para saber quais são suas opções
              de empréstimo!
            </div>
            <button
              className="bg-secundaryDark hover:bg-secundary text-white/95 p-6 xl:p-5  rounded-full absolute
                         -bottom-1 xl:bottom-[1.6rem]
                          transition-all duration-300 easy-in hover:shadow-sm hover:shadow-secundaryDark select-none"
            >
              <MessageCircleMore className="inline-block w-auto h-[5rem] xl:h-[3.4rem]" />
            </button>
            <div className="xl:block hidden h-[0.1rem] w-[80%] rounded-full bg-red-950 absolute -bottom-2.5"></div>
          </div>
          {/* parte direita inferior */}
          <div className="flex-1 h-full p-4 justify-end items-center flex flex-col gap-2 select-none">
            {/* Porcentagem por escrito */}
            <div
              className="font-istok-web text-8xl font-black w-full text-center mb-12 xl:mb-7 transition-colors duration-500"
              style={{ color: color.base }}
            >
              {percentual}%
            </div>
            {/* Porcentagem */}
            <div
              className="h-[2rem] w-full max-w-[20rem] rounded-full bg-white border-[2px] border-gray-600
                        relative overflow-hidden
                        flex flex-row items-start justify-start"
            >
              <div
                className="absolute bottom-0 w-full h-full bg-gradient-to-t from-gray-500 to-transparent 
                              rounded-r-full"
              ></div>
              <div className="h-10 w-[10%]"></div>
              <div className="h-[40%] w-[1px] rounded-t-full bg-gray-600 z-[3]"></div>
              <div className="h-10 w-[10%]"></div>
              <div className="h-[40%] w-[1px] rounded-t-full bg-gray-600 z-[3]"></div>
              <div className="h-10 w-[10%]"></div>
              <div className="h-[40%] w-[1px] rounded-t-full bg-gray-600 z-[3]"></div>
              <div className="h-10 w-[10%]"></div>
              <div className="h-[40%] w-[1px] rounded-t-full bg-gray-600 z-[3]"></div>
              <div className="h-10 w-[10%]"></div>
              <div className="h-[40%] w-[1px] rounded-t-full bg-gray-600 z-[3]"></div>
              <div className="h-10 w-[10%]"></div>
              <div className="h-[40%] w-[1px] rounded-t-full bg-gray-600 z-[3]"></div>
              <div className="h-10 w-[10%]"></div>
              <div className="h-[40%] w-[1px] rounded-t-full bg-gray-600 z-[3]"></div>
              <div className="h-10 w-[10%]"></div>
              <div className="h-[40%] w-[1px] rounded-t-full bg-gray-600 z-[3]"></div>
              <div className="h-10 w-[10%]"></div>
              <div className="h-[40%] w-[1px] rounded-t-full bg-gray-600 z-[3]"></div>
              <div className="h-10 w-[10%]"></div>
              <div
                className="absolute left-0 top-0 h-full rounded-r-full z-[2] transition-all duration-1000 ease-in-out"
                style={{ width: `${percentual}%`, background: color.base }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(to bottom, ${color.grad1}, transparent)`,
                    borderTopRightRadius: "9999px",
                    borderBottomRightRadius: "9999px",
                  }}
                ></div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(to bottom left, ${color.grad2}, transparent)`,
                    borderTopRightRadius: "9999px",
                    borderBottomRightRadius: "9999px",
                  }}
                ></div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(to top, ${color.grad3}, transparent)`,
                    borderTopRightRadius: "9999px",
                    borderBottomRightRadius: "9999px",
                  }}
                ></div>
                {/* Barra de porcentagem*/}
              </div>
            </div>
            {/* Título */}
            <div
              className="font-istok-web font-black text-xl xl:text-xl md:text-2xl w-full text-center text-white
                            mt-2"
            >
              SCORE DE CRÉDITO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
