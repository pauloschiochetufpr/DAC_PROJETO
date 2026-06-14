import GerenteForm from "../components/admin/GerenteForm";
import GerentesLista from "../components/admin/GerentesLista";
import { useEffect, useState } from "react";

import { GerenteService } from "../services/GerenteService";

export default function GerenciarGerentes() {
  const [gerentes, setGerentes] = useState([]);
  const [loadingGerentes, setLoadingGerentes] = useState(true);
  const [erroGerentes, setErroGerentes] = useState(null);
  const [gerenteSelecionado, setGerenteSelecionado] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function carregarGerentes() {
      try {
        setLoadingGerentes(true);
        setErroGerentes(null);

        const data = await GerenteService.listarDashboard();

        const gerentesNormalizados = (data ?? []).map((item) => {
          const clientes = Array.isArray(item.clientes) ? item.clientes : [];

          return {
            cpf: item.gerente?.cpf ?? "",
            nome: item.gerente?.nome ?? "",
            email: item.gerente?.email ?? "",
            telefone: item.gerente?.telefone ?? "",
            cidade: item.gerente?.cidade ?? "",
            estado: item.gerente?.estado ?? "",
            tipo: item.gerente?.tipo ?? "gerente",

            clientes,
            totalClientes: clientes.length,

            somaSaldosPositivos: Number(item.saldo_positivo ?? 0),

            somaSaldosNegativos: Math.abs(Number(item.saldo_negativo ?? 0)),
          };
        });

        setGerentes(gerentesNormalizados);
      } catch (err) {
        console.error("Erro ao carregar gerentes:", err);

        setGerentes([]);
        setErroGerentes(err.message || "Erro ao carregar gerentes.");
      } finally {
        setLoadingGerentes(false);
      }
    }

    carregarGerentes();
  }, [refreshKey]);

  const handleRefresh = () => {
    setGerenteSelecionado(null);
    setRefreshKey((atual) => atual + 1);
  };

  const handleCriar = async (dados) => {
    await GerenteService.criar(dados);
    handleRefresh();
  };

  const handleAtualizar = async (cpf, dados) => {
    await GerenteService.atualizar(cpf, dados);
    handleRefresh();
  };

  const handleExcluir = async (cpf) => {
    await GerenteService.excluir(cpf);
    handleRefresh();
  };

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
        <div
          className="w-full xl:w-[40%] xl:min-w-[22rem] flex-shrink-0
                     xl:h-full h-[75vh]
                     bg-brandDark/50 backdrop-blur-lg rounded-2xl
                     border border-secundary/70 shadow-dourado-sutil overflow-hidden"
        >
          <GerentesLista
            gerentes={gerentes}
            loading={loadingGerentes}
            erro={erroGerentes}
            modo="alfabetico"
            onSelect={setGerenteSelecionado}
            selectedId={gerenteSelecionado?.cpf ?? null}
          />
        </div>
        <div
          className="w-full h-fit xl:flex-1 xl:min-h-0
                       bg-brandDark/50 backdrop-blur-lg rounded-2xl
                       border border-secundary/70 shadow-dourado-sutil overflow-hidden"
        >
          <GerenteForm
            gerenteSelecionado={gerenteSelecionado}
            onCriar={handleCriar}
            onAtualizar={handleAtualizar}
            onExcluir={handleExcluir}
            onClear={() => setGerenteSelecionado(null)}
          />
        </div>
      </div>
    </div>
  );
}
