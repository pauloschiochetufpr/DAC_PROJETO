import WaveSimpleRed from "../components/WaveSimpleRed";
import SecundaryBorder from "../assets/icons/SecundaryBorder.svg";
import { useState } from "react";

// componentes
/// Credito
import Credito from "../components/emprestimo/Credito";

export default function HomeGerente() {
  const [isHovering, setIsHovering] = useState(false);
  const [isPermanent, setIsPermanent] = useState(false);
  const balance = "1000,00";
  const masked = "--,--";
  return (
    <div className="relative flex flex-col items-center">
      {/* Primeira parte */}
      <div
        className="h-[50rem] w-full flex items-center md:justify-center xl:justify-between justify-end bg-gradient-to-tr from-brand/40 to-transparent relative
                  px-3 pt-[20rem] md:p-20 md:px-24 xl:px-16 2xl:px-32 md:pt-[29rem]"
      >
        {/* Extrato tela grande */}
        <div className="bg-purple-400 w-[40rem] 2xl:w-[42%] h-[30rem] hidden xl:block relative"></div>
        {/* Container do saldo */}
        <div
          className="w-[80rem] xl:w-[30rem] md:w-[45rem] 2xl:w-[45rem] h-[30rem] bg-transparent border-[0.5rem]
          border-secundaryDark
          rounded-[21px] flex flex-col z-[100] shadow-dourado"
        >
          {/* Wallpaper top do componente */}
          <div className="relative overflow-hidden rounded-t-xl w-full h-[4rem] md:h-[6rem] shadow-black/45 shadow-lg">
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
            <WaveSimpleRed className="z-[10]" />
          </div>
          {/* Inicio da parte inferior do componente */}
          <div className="bg-gradient-to-b from-brandDark/70 to-brand/60 flex-1 rounded-b-xl relative flex overflow-hidden">
            {/* Efeitos */}
            <div className="w-full h-full absolute top-0 left-0 z-[11] bg-gradient-to-t from-transparent to-black/25"></div>
            <div className="w-full h-full absolute top-0 left-0 z-[12] bg-white/[0.02]"></div>
            {/* Container do conteudo */}
            <div className="z-[12] w-full h-full flex flex-col items-center justify-start px-3 pt-10 md:pt-14 md:px-8">
              {/* Primeira fita do conteúdo (saldo) */}
              <button
                className="relative w-[80%] md:w-[35rem] h-[5rem] flex items-center justify-center overflow-visible
                          md:border-t-[2px] md:border-b-[2px] border-t-[3px] border-b-[3px]
                          border-secundary select-none group
                              "
              >
                <div className="absolute left-0 top-0 w-full h-full flex flex-row">
                  <div className="absolute left-0 top-0 w-full h-full bg-white/[0.05]"></div>
                  <div className="w-[50%] h-full bg-gradient-to-r from-transparent to-brand/60"></div>
                  <div className="flex-1 bg-gradient-to-l from-transparent to-brand/60"></div>
                </div>
                <img
                  src={SecundaryBorder}
                  alt="Borda esquerda"
                  className="absolute left-0 top-1/2 -translate-x-[45%] -translate-y-1/2 h-[7rem] w-auto object-contain
                  select-none pointer-events-none"
                />

                <img
                  src={SecundaryBorder}
                  alt="Borda direita"
                  className="absolute right-0 top-1/2 translate-x-[45%] -translate-y-1/2 h-[7rem] w-auto object-contain
                  scale-x-[-1] select-none pointer-events-none"
                />

                <div
                  className="relative z-[5] text-secundary font-semibold text-xl sm:text-2xl md:text-3xl text-center px-4 w-full font-inter"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  onClick={() => setIsPermanent(true)}
                >
                  <span
                    className={`flex items-center justify-center gap-2 md:gap-4 transition-all duration-250 ease-out ${!isPermanent && isHovering ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
                  >
                    <span className="font-long-cang text-4xl sm:text-5xl md:text-6xl pb-1 inline-block leading-none">
                      R$
                    </span>
                    {balance}
                  </span>

                  <span
                    className={`absolute inset-0 flex items-center justify-center gap-2 md:gap-4 transition-all duration-250 ease-out ${!isPermanent && isHovering ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                  >
                    <span className="font-long-cang text-4xl sm:text-5xl md:text-6xl pb-1 inline-block leading-none">
                      R$
                    </span>
                    {masked}
                  </span>
                </div>
              </button>
              {/* Segunda fita do conteúdo (informações adicionais) */}
              <button
                className="mt-[5rem] text-2xl xl:text-4xl font-orienta flex items-center justify-center h-fit w-fit
                px-12 py-3 xl:px-12 xl:py-4 rounded-full relative overflow-hidden
                select-none border-2 border-secundaryDark
                xl:duration-200 xl:ease-out xl:transition-all xl:hover:shadow-lg xl:hover:shadow-brandDark
                xl:active:shadow-none "
              >
                <div
                  className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden
                            "
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
                  <WaveSimpleRed className="w-full h-full" />
                </div>
                <span className="relative z-10">TRANSAÇÕES</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Segunda parte */}
      <div
        className="w-full h-fit bg-gradient-to-t from-brandDark to-red-700 flex xl:flex-row md:items-center
                    flex-col items-center justify-center xl:px-40 py-24 xl:pt-36 md:justify-end"
      >
        {/* Extrato tela pequena */}
        <div className="w-[90%] h-[40rem] bg-purple-400 xl:hidden "></div>
        {/* Crédito */}
        <div
          className="xl:w-[40rem] w-[90%] xl:h-[40rem] h-[70rem]
         relative flex justify-center items-center overflow-hidden"
        >
          <Credito />
        </div>
      </div>
    </div>
  );
}
