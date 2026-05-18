import { useEffect, useState } from "react";

// Componentes do gerente
import ListaAprovacao from "../components/gerente/ListaAprovacao";
import ListaClientes from "../components/gerente/ListaClientes";
import Podium from "../components/listas/Podium";
import BotaoPergaminho from "../components/UI/BotaoPergaminho";

//mock
import { Gerente_CPF } from "../mocks/gerenteMockData";

// Lucide
import { UserRoundSearch } from "lucide-react";

//i18n
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../lib/i18n";

// Serviços
import { ClienteService } from "../services/ClienteService";
import { GerenteService } from "../services/GerenteService";

export default function HomeGerente() {
  const { lang } = useLanguage();

  const [clientesPendentes, setClientesPendentes] = useState([]);
  const [loadingPendentes, setLoadingPendentes] = useState(true);
  const [erroPendentes, setErroPendentes] = useState(null);
  const [meusClientes, setMeusClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [erroClientes, setErroClientes] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoadingPendentes(true);
        setLoadingClientes(true);

        const [pendentesResponse, meusClientesResponse] = await Promise.all([
          ClienteService.listarPendentes(),

          GerenteService.listarClientes(Gerente_CPF),
        ]);

        setClientesPendentes(pendentesResponse.data);

        setMeusClientes(meusClientesResponse.data);

        setErroPendentes(null);
        setErroClientes(null);
      } catch (err) {
        console.error(err);

        setErroPendentes("Erro ao carregar clientes pendentes");
        setErroClientes("Erro ao carregar clientes");
      } finally {
        setLoadingPendentes(false);
        setLoadingClientes(false);
      }
    }

    carregarDados();
  }, []);

  async function handleAprovar(cpf) {
    try {
      await ClienteService.aprovar(cpf);

      setClientesPendentes((prev) => prev.filter((c) => c.cpf !== cpf));

      setFeedback({
        tipo: "sucesso",
        msg: "Cliente aprovado",
      });

      return true;
    } catch (err) {
      setFeedback({
        tipo: "erro",
        msg: "Erro ao aprovar cliente",
      });

      return false;
    }
  }

  async function handleRejeitar(cpf, motivo) {
    try {
      await ClienteService.rejeitar(cpf, motivo);

      setClientesPendentes((prev) => prev.filter((c) => c.cpf !== cpf));

      setFeedback({
        tipo: "sucesso",
        msg: "Cliente rejeitado",
      });
      return true;
    } catch (err) {
      setFeedback({
        tipo: "erro",
        msg: "Erro ao rejeitar cliente",
      });
      return false;
    }
  }

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [feedback]);

  return (
    <div
      className="relative flex flex-col items-center w-full min-h-screen
                  pt-[12rem] md:pt-[14rem] pb-12 gap-12"
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
          <ListaAprovacao
            clientes={clientesPendentes}
            loading={loadingPendentes}
            erro={erroPendentes}
            feedback={feedback}
            onAprovar={handleAprovar}
            onRejeitar={handleRejeitar}
          />
        </div>

        {/* Consulta de Clientes */}
        <div
          className="w-full xl:h-[68vh] 2xl:h-[73vh] bg-brandDark/50 backdrop-blur-lg
                      rounded-2xl border border-secundary/70 shadow-dourado-sutil
                      "
        >
          <ListaClientes
            clientes={meusClientes}
            loading={loadingClientes}
            erro={erroClientes}
          />
        </div>
      </div>
      {/* Container secundário | Botões de navegação + pódio */}
      <div className="xl:flex-row flex-col gap-10 flex h-fit w-full mt-10 md:px-32 z-[200]">
        <div className="w-full h-fit justify-center items-center flex">
          <div className="w-screen xl:w-fit h-fit sm:py-16 xl:px-10 xl:py-8 bg-black/20 shadow-inner shadow-black/70 md:rounded-md">
            <Podium />
          </div>
        </div>
        <div className="w-full h-fit justify-center flex flex-row xl:mt-14">
          <div className="h-[12rem] w-[60%] md:w-[10rem]">
            <BotaoPergaminho
              text={t(lang, "HomeManager.especialized_consultation")}
              icon={UserRoundSearch}
              ref={"/consulta_especializada"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
