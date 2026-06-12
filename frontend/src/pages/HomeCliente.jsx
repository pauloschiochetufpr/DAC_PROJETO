// SVG's
import WaveSimpleRed from "../components/WaveSimpleRed";
import WaveSimpleRedReverse from "../components/WaveSimpleRedReverse";
import SecundaryBorder from "../assets/icons/SecundaryBorder.svg";

// Lucide icon's
import { Eye, EyeClosed } from "lucide-react";

// i18n
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../lib/i18n";

// Libs
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Context e Services
import { useAuth } from "../hooks/useAuth";
import { ClienteService } from "../services/ClienteService";
import { ContaService } from "../services/ContaService";

// componentes
/// Credito
import Credito from "../components/emprestimo/Credito";
/// Extrato
import Extrato from "../components/listas/Extrato";
/// Extrato mobyle
import MiniExtratoMob from "../components/listas/MiniExtratoMob";

export default function HomeCliente() {
  const { lang } = useLanguage();
  const { usuario } = useAuth();

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [extrato, setExtrato] = useState(null);
  const [loadingExtrato, setLoadingExtrato] = useState(true);
  const [erroExtrato, setErroExtrato] = useState(null);

  // States de interface
  const [showInfo, setShowInfo] = useState(
    () => localStorage.getItem("showInfo") !== "false",
  );

  useEffect(() => {
    async function carregarDadosCliente() {
      if (!usuario?.cpf) {
        setErro("Não foi possível identificar o cliente autenticado.");
        setLoading(false);
        setLoadingExtrato(false);
        return;
      }

      try {
        setLoading(true);
        setErro(null);

        const clienteData = await ClienteService.buscarPorCpf(usuario.cpf);
        setCliente(clienteData);

        if (!clienteData?.conta) {
          setErroExtrato("Conta do cliente não encontrada.");
          setLoadingExtrato(false);
          return;
        }

        try {
          setLoadingExtrato(true);
          setErroExtrato(null);

          const extratoData = await ContaService.buscarExtrato(
            clienteData.conta,
          );
          setExtrato(extratoData);
        } catch (err) {
          console.error("Erro ao carregar extrato:", err);
          setErroExtrato(err.message || "Erro ao carregar extrato.");
        } finally {
          setLoadingExtrato(false);
        }
      } catch (err) {
        console.error("Erro ao carregar cliente:", err);
        setErro(err.message || "Erro ao carregar os dados do cliente.");
        setLoadingExtrato(false);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosCliente();
  }, [usuario?.cpf]);

  const toggleShowInfo = () => {
    setShowInfo((prev) => {
      const next = !prev;
      localStorage.setItem("showInfo", String(next));
      return next;
    });
  };
  const normalizarTipoMovimentacao = (tipo) => {
    return String(tipo || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Dados do cliente
  const numeroConta = cliente?.conta ?? extrato?.conta ?? "";
  const saldo = Number(cliente?.saldo ?? 0);
  const balance = saldo.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const movimentacoes = (extrato?.movimentacoes ?? []).map((m, index) => ({
    id: `${m.data}-${m.tipo}-${m.valor}-${index}`,
    data: m.data,
    tipo: normalizarTipoMovimentacao(m.tipo),
    tipoOriginal: m.tipo,
    origem: m.origem,
    destino: m.destino,
    valor: Number(m.valor ?? 0),
  }));
  const masked = "--,--";

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute right-6 top-10 z-[20000]">
        <Link to="/perfil">
          <button className="bg-secundary text-white px-4 py-2 rounded-lg hover:bg-secundaryHover transition">
            Perfil
          </button>
        </Link>
      </div>
      {/* Primeira parte */}
      <div
        className="h-[50rem] w-full flex items-center md:justify-center xl:justify-between justify-end 
        bg-gradient-to-tr from-brand/40 to-transparent relative
        px-3 pt-[20rem] md:p-20 md:px-24 xl:px-16 2xl:px-32 md:pt-[29rem]"
      >
        {/* Extrato tela grande */}
        <div className="w-[46%] 2xl:w-[42%] h-[30rem] hidden xl:block relative">
          <Extrato
            showInfo={showInfo}
            movimentacoes={movimentacoes}
            conta={numeroConta}
            loading={loadingExtrato}
            erro={erroExtrato}
          />
        </div>
        {/* Container do saldo */}
        <div
          className="w-[80rem] xl:w-[30rem] md:w-[45rem] 2xl:w-[45rem] h-[25rem] md:h-[31rem] xl:h-[35rem] 2xl:h-[30rem] bg-transparent border-[0.5rem]
          border-secundaryDark
          rounded-[21px] flex flex-col z-[100] shadow-dourado"
        >
          {/* Wallpaper top */}
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
            <div
              className="z-[19] flex flex-row absolute
                        left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
                            md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                            xl:left-10 xl:translate-x-0
                            w-fit h-full
                            items-center justify-center"
            >
              <h1
                className="xl:pl-1 xl:pt-1 sm:text-base md:text-2xl xl:text-3xl
                          font-bold font-istok-web select-none
                          "
              >
                <div className="bg-black/50 shadow-inner shadow-black rounded-lg px-4 py-2 select-none text-nowrap font-orienta">
                  {t(lang, "HomeClient.accountNumber")}: {numeroConta}
                </div>
              </h1>
            </div>
          </div>
          {/* Inicio da parte inferior do componente */}
          <div
            className="bg-gradient-to-b from-brandDark/70 to-brand/60 flex-1 rounded-b-xl relative flex overflow-hidden
                      "
          >
            {/* Efeitos */}
            <div className="absolute h-full w-fullo z-[1] blur-xl bg-transparent top-0 left-0"></div>
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
                onClick={() => toggleShowInfo()}
              >
                {showInfo ? (
                  <Eye
                    className="absolute right-0 scale-50 xl:scale-100
                    xl:right-[5rem] 2xl:right-[3rem] text-secundary z-[100]"
                    size={40}
                  />
                ) : (
                  <EyeClosed
                    className="absolute right-0 scale-50 xl:scale-100
                    xl:right-[5rem]  2xl:right-[3rem] text-secundary z-[100]"
                    size={40}
                  />
                )}
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

                <div className="relative z-[5] text-secundary font-semibold text-xl sm:text-2xl md:text-3xl text-center px-4 w-full font-inter">
                  <span
                    className={`flex items-center justify-center gap-2 md:gap-4 transition-all
                                duration-250 ease-out`}
                  >
                    <span className="font-long-cang text-4xl sm:text-5xl md:text-6xl pb-1 inline-block leading-none">
                      R$
                    </span>
                    {showInfo ? balance : masked}
                  </span>
                </div>
              </button>

              {/* Segunda fita do conteúdo (informações adicionais) */}
              <div
                className="flex flex-col 2xl:flex-row
                              gap-[1.3rem] mt-[2.3rem]
                              md:mt-[3rem] md:gap-[2rem] xl:gap-[1rem]
                              xl:mt-[5rem]"
              >
                <Link
                  className=" text-2xl xl:text-4xl font-orienta flex items-center justify-center h-fit w-fit
                    px-12 py-3 xl:px-12 xl:py-4 rounded-md relative overflow-hidden
                    select-none border-2 border-secundaryDark group
                    xl:duration-200 xl:ease-out xl:transition-all
                    font-extrabold"
                  to="/operations"
                >
                  <div
                    className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden
                                opacity-65 group-hover:opacity-100 transition-opacity duration-300"
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
                    <WaveSimpleRedReverse className="w-full h-full" />
                  </div>
                  <span className="relative z-10 ">
                    {t(lang, "HomeClient.actions.transactions")}
                  </span>
                </Link>
                <Link
                  className="text-2xl xl:text-4xl font-orienta flex items-center justify-center
                    h-fit w-fit 2xl:min-w-[15rem] xl:min-w-[20rem] min-w-[15rem]
                    px-12 py-3 xl:px-12 xl:py-4 rounded-md relative overflow-hidden group
                    select-none border-2 border-secundaryDark
                    xl:duration-200 xl:ease-out xl:transition-all
                    font-extrabold"
                  to="/extrato"
                >
                  <div
                    className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden
                                opacity-65 group-hover:opacity-100 transition-opacity duration-300"
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
                    <WaveSimpleRedReverse className="w-full h-full" />
                  </div>
                  <span className="relative z-10 ">
                    {t(lang, "HomeClient.actions.statement")}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Segunda parte */}
      <div
        className="w-full h-fit bg-gradient-to-t from-brandDark to-red-700 flex xl:flex-row md:items-center
                  flex-col items-center justify-center xl:px-[1.8rem] py-12 pt-4 xl:pt-36 md:justify-end"
      >
        <div
          className="w-full h-fit mt-10
         relative flex justify-center items-center overflow-hidden sm:hidden"
        >
          <MiniExtratoMob
            showInfo={showInfo}
            movimentacoes={movimentacoes}
            conta={numeroConta}
            loading={loadingExtrato}
            erro={erroExtrato}
          />
        </div>
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
