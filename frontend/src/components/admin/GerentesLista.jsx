import { useState, useEffect } from "react";

// Mock's
import { getGerentesAdmin } from "../../mocks/adminMockData";

// Lucide
import {
  Users,
  TrendingUp,
  TrendingDown,
  LoaderCircle,
  Bug,
} from "lucide-react";

// SVG's
import WaveSimpleRed from "../WaveSimpleRed";

// Formatadores
const fmtBRL = (v) =>
  Math.abs(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const cpfMask = (cpf) =>
  cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

export default function GerentesLista() {
  // State gerentes
  const [gerentes, setGerentes] = useState([]);

  // States de interface
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Simula GET /admin/gerentes
  useEffect(() => {
    let cancelado = false;
    getGerentesAdmin().then((res) => {
      if (cancelado) return;
      if (res.status === 200) {
        setGerentes(res.data);
        setErro(null);
      } else {
        setErro(res.message || "Erro ao buscar gerentes.");
      }
      setLoading(false);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-0">
      {/* Cabeçalho */}
      <div className="rounded-t-2xl w-full h-fit shadow-md shadow-black/40 relative flex-shrink-0">
        <div
          className="w-full h-[4.5rem] relative rounded-t-2xl overflow-hidden flex items-center justify-center
                     shadow-inner shadow-black/90"
        >
          <div className="absolute inset-0 bg-white/[0.05] z-[14]" />
          <div className="absolute inset-0 flex flex-row z-[13]">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-white/[0.14]" />
            <div className="flex-1 bg-gradient-to-l from-transparent to-white/[0.14]" />
          </div>
          <div className="absolute inset-0 flex flex-row z-[13]">
            <div className="w-1/2 h-full bg-gradient-to-l from-transparent to-black/[0.32]" />
            <div className="flex-1 bg-gradient-to-r from-transparent to-black/[0.32]" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/40 z-[12]" />
          <WaveSimpleRed className="z-[-3]" />
          <div
            className="font-orienta text-xl md:text-3xl text-secundary
                       select-none text-center z-[19] px-5 py-2 pb-3 bg-black/50 rounded-md
                       shadow-inner shadow-black"
          >
            Gerentes
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="flex-1 min-h-0 overflow-hidden p-3 pt-4">
        {loading && (
          <div className="flex items-center justify-center h-full select-none">
            <LoaderCircle size={60} className="text-secundary animate-spin" />
          </div>
        )}

        {erro && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400 font-inter">
            <Bug size={60} className="select-none" />
            <span className="text-center">{erro}</span>
          </div>
        )}

        {!loading && !erro && (
          <div
            className="h-full overflow-y-auto flex flex-col gap-3 pb-2 overscroll-none px-3
                       scrollbar-thin scrollbar-thumb-secundary scrollbar-track-brandDark"
          >
            {gerentes.map((ger, idx) => (
              <CardGerente key={ger.id} gerente={ger} posicao={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Card individual de gerente
function CardGerente({ gerente, posicao }) {
  const medalha =
    posicao === 1
      ? "border-yellow-400/60"
      : posicao === 2
        ? "border-gray-300/40"
        : posicao === 3
          ? "border-amber-600/40"
          : "border-secundaryDark/25";

  return (
    <div
      className={`rounded-xl border ${medalha} bg-black/20 select-none px-3 py-3 flex flex-col gap-2`}
    >
      {/* Cabeçalho | posição + nome + clientes */}
      <div className="flex items-start gap-2">
        <span className="font-orienta text-secundary text-base w-6 text-center flex-shrink-0 leading-tight">
          {posicao}º
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-orienta text-contrast text-sm leading-tight truncate">
            {gerente.nome}
          </div>
          <div className="font-inter text-contrastDark text-[10px] truncate">
            {gerente.cidade}, {gerente.estado}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Users size={13} className="text-contrastDark" />
          <span className="font-inter text-contrast text-xs">
            {gerente.totalClientes} clientes
          </span>
        </div>
      </div>

      {/* Dados de contato */}
      <div className="flex flex-col gap-0.5 border-t border-secundaryDark/20 pt-2">
        <Row label="CPF" valor={cpfMask(gerente.cpf)} />
        <Row label="E-mail" valor={gerente.email} />
        <Row label="Telefone" valor={gerente.telefone} />
      </div>

      {/* Saldos e resultados */}
      <div className="flex flex-col gap-0.5 border-t border-secundaryDark/20 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-green-400/80">
            <TrendingUp size={12} />
            <span className="font-inter text-[10px]">Saldos Positivos</span>
          </div>
          <span className="font-inter text-[10px] text-green-400 font-medium">
            {fmtBRL(gerente.somaSaldosPositivos)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-red-400/80">
            <TrendingDown size={12} />
            <span className="font-inter text-[10px]">Saldos Negativos</span>
          </div>
          <span className="font-inter text-[10px] text-red-400 font-medium">
            -{fmtBRL(gerente.somaSaldosNegativos)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, valor }) {
  return (
    <div className="flex justify-between gap-2 font-inter text-[10px]">
      <span className="text-contrastDark flex-shrink-0">{label}</span>
      <span className="text-contrast text-right truncate max-w-[65%]">
        {valor}
      </span>
    </div>
  );
}
