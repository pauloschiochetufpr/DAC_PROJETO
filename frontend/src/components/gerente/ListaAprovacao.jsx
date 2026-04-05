import { useState, useEffect } from "react";

// Mocks
import { useGerente } from "../../hooks/useGerente";

// Componentes
import CardAprovacao from "./CardAprovacao";

// SVG's
import WaveSimpleRed from "../WaveSimpleRed";

// Lucide
import { Bug, TicketX } from "lucide-react";

export default function ListaAprovacao({ idGerente }) {
  const { getClientesFiltrados, aprovarCliente, rejeitarCliente } =
    useGerente();

  // Estado local dos clientes pendentes
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Feedback de ação (aprovação/rejeição)
  const [feedback, setFeedback] = useState(null);

  // Busca inicial e re-busca ao mudar dependências
  useEffect(() => {
    let cancelado = false;

    getClientesFiltrados("para_aprovar", idGerente).then((res) => {
      if (cancelado) return;
      if (res.status === 200) {
        setPendentes(res.data);
        setErro(null);
      } else {
        setErro(res.message || "Erro ao buscar pendentes.");
      }
      setLoading(false);
    });

    return () => {
      cancelado = true;
    };
  }, [getClientesFiltrados, idGerente]);

  // Handlers
  const handleAprovar = async (cpf) => {
    const res = await aprovarCliente(cpf);
    if (res.status === 200) {
      setFeedback({ tipo: "sucesso", msg: res.message });
      setPendentes((prev) => prev.filter((c) => c.cpf !== cpf));
    } else {
      setFeedback({ tipo: "erro", msg: res.message });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleRejeitar = async (cpf, motivo) => {
    const res = await rejeitarCliente(cpf, motivo);
    if (res.status === 200) {
      setFeedback({ tipo: "sucesso", msg: res.message });
      setPendentes((prev) => prev.filter((c) => c.cpf !== cpf));
    } else {
      setFeedback({ tipo: "erro", msg: res.message });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

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
            className="font-orienta text-xl md:text-3xl text-secundary
                      select-none text-center z-[19] px-5 py-2 pb-3 bg-black/50 rounded-md
                      shadow-inner shadow-black"
          >
            Aprovação de Clientes
          </div>
        </div>
      </div>

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

      {!loading && !erro && pendentes.length === 0 && (
        <p
          className="text-contrast font-inter text-center text-base md:text-xl
        pb-8 md:pt-40 flex flex-col items-center justify-center gap-2 w-full select-none"
        >
          <TicketX size={65} className="inline-block" />
          Nenhum autocadastro pendente
        </p>
      )}

      {/* Tabela de pendentes */}
      {!loading && !erro && pendentes.length > 0 && (
        <div className="h-full w-full pb-3 px-3">
          <div
            className="overflow-hidden h-full w-full rounded-xl border border-secundaryDark/60
                      scrollbar-thin scrollbar-thumb-secundary scrollbar-track-brandDark md:overscroll-none
                      shadow-inner shadow-black/20"
          >
            {/* Corpo */}
            <div className="overflow-x-hidden overflow-y-scroll py-3 h-full flex flex-col gap-2 px-2">
              {pendentes.map((cliente) => (
                <CardAprovacao
                  key={cliente.cpf}
                  cliente={cliente}
                  fmtBRL={fmtBRL}
                  onAprovar={handleAprovar}
                  onRejeitar={handleRejeitar}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
