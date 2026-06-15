import { useEffect, useMemo, useState } from "react";

// Components
import GerentesLista from "../components/admin/GerentesLista";
import GraficoSaldos from "../components/admin/GraficoSaldos";
import ClientesAdminLista from "../components/admin/ClientesAdminLista";
import BotaoPergaminho from "../components/UI/BotaoPergaminho";
import BotaoLogout from "../components/BotaoLogout";

// Lucide
import { Construction, UserRoundSearch } from "lucide-react";

//serviços
import { GerenteService } from "../services/GerenteService";
import { ClienteService } from "../services/ClienteService";

// i18n
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../lib/i18n";

export default function HomeAdmin() {
  // i18n
  const { lang } = useLanguage();

  const [gerentes, setGerentes] = useState([]);
  const [loadingGerentes, setLoadingGerentes] = useState(true);
  const [erroGerentes, setErroGerentes] = useState(null);

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [erroClientes, setErroClientes] = useState(null);

  const GenGerBt = t(lang, "HomeAdmin.manage_managers");

  useEffect(() => {
    async function carregarDadosAdmin() {
      setLoadingGerentes(true);
      setLoadingClientes(true);

      setErroGerentes(null);
      setErroClientes(null);

      const [gerentesResult, clientesResult] = await Promise.allSettled([
        GerenteService.listarDashboard(),
        ClienteService.listarRelatorioAdmin(),
      ]);

      // Dashboard dos gerentes
      if (gerentesResult.status === "fulfilled") {
        const gerentesNormalizados = (gerentesResult.value ?? []).map(
          (item) => {
            const clientesGerente = Array.isArray(item.clientes)
              ? item.clientes
              : [];

            return {
              cpf: item.gerente?.cpf ?? "",
              nome: item.gerente?.nome ?? "",
              email: item.gerente?.email ?? "",
              telefone: item.gerente?.telefone ?? "",
              cidade: item.gerente?.cidade ?? "",
              estado: item.gerente?.estado ?? "",
              tipo: item.gerente?.tipo ?? "gerente",

              clientes: clientesGerente,
              totalClientes: clientesGerente.length,

              somaSaldosPositivos: Number(item.saldo_positivo ?? 0),
              somaSaldosNegativos: Math.abs(Number(item.saldo_negativo ?? 0)),
            };
          },
        );

        setGerentes(gerentesNormalizados);
      } else {
        console.error(
          "Erro ao carregar dashboard dos gerentes:",
          gerentesResult.reason,
        );

        setGerentes([]);

        setErroGerentes(
          gerentesResult.reason?.message ||
            "Erro ao carregar dashboard dos gerentes.",
        );
      }

      // Relatório administrativo de clientes
      if (clientesResult.status === "fulfilled") {
        const clientesNormalizados = (clientesResult.value ?? []).map(
          (cliente) => ({
            ...cliente,

            cpf: cliente.cpf ?? "",
            nome: cliente.nome ?? "",
            email: cliente.email ?? "",
            telefone: cliente.telefone ?? "",

            conta: cliente.conta ?? "",

            saldo: Number(cliente.saldo ?? 0),
            salario: Number(cliente.salario ?? 0),
            limite: Number(cliente.limite ?? 0),

            // DadosClienteResponseDTO retorna o CPF no campo `gerente`
            gerente_cpf: cliente.gerente ?? "",
            gerente_nome: cliente.gerente_nome ?? "",
            gerente_email: cliente.gerente_email ?? "",
          }),
        );

        setClientes(clientesNormalizados);
      } else {
        console.error(
          "Erro ao carregar relatório de clientes:",
          clientesResult.reason,
        );

        setClientes([]);

        setErroClientes(
          clientesResult.reason?.message ||
            "Erro ao carregar relatório de clientes.",
        );
      }

      setLoadingGerentes(false);
      setLoadingClientes(false);
    }

    carregarDadosAdmin();
  }, []);

  const gerentesExibidos = useMemo(() => {
    return gerentes.sort(
      (a, b) => b.somaSaldosPositivos - a.somaSaldosPositivos,
    );
  }, [gerentes]);

  const clientesDashboard = useMemo(
    () => gerentes.flatMap((gerente) => gerente.clientes ?? []),
    [gerentes],
  );

  return (
    <div
      className="relative flex flex-col items-center w-full min-h-screen
                 pt-[12rem] md:pt-[12.5rem] 2xl:pt-[13rem] pb-12 px-2 md:px-4 gap-6"
    >
      <div className="absolute right-6 top-10 z-[20000]">
        <BotaoLogout />
      </div>
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
          <GerentesLista
            gerentes={gerentes}
            loading={loadingGerentes}
            erro={erroGerentes}
            modo="ranking"
          />
        </div>

        {/* Coluna 2  */}
        <div className="flex-1 flex flex-col gap-5 xl:h-full min-h-0">
          {/* Gráfico pizza  */}
          <div
            className="w-full flex-shrink-0 xl:h-[13rem] h-fit gap-4 xl:flex-row flex-col flex
                       overflow-hidden"
          >
            <GraficoSaldos
              clientes={clientesDashboard}
              loading={loadingGerentes}
              erro={erroGerentes}
            />
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
            <ClientesAdminLista
              clientes={clientes}
              loading={loadingClientes}
              erro={erroClientes}
            />
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
