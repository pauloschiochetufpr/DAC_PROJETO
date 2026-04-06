import { useState, useRef, useEffect, useMemo } from "react";

// Mock's
import { useGerente } from "../../hooks/useGerente";

// SVG's
import WaveSimpleRedReverse from "../WaveSimpleRedReverse";

// Lucide
import {
  Search,
  LoaderCircle,
  Copy,
  UserRoundX,
  UserRoundSearch,
} from "lucide-react";

// Componente principal
export default function ConsultaClientePanel() {
  const { getClientePorCpf, clientes } = useGerente();

  // States
  const [cpfInput, setCpfInput] = useState("");
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [erro, setErro] = useState(null);

  // Refs para fechar popup ao clicar fora
  const inputWrapRef = useRef(null);

  // Autocomplete
  const sugestoes = useMemo(() => {
    const termo = cpfInput.trim().toLowerCase();
    if (!termo) return [];
    return clientes.filter((c) => c.cpf.includes(termo)).slice(0, 6);
  }, [cpfInput, clientes]);

  // Fecha popup ao clicar fora do input
  useEffect(() => {
    const handler = (e) => {
      if (inputWrapRef.current && !inputWrapRef.current.contains(e.target)) {
        setMostrarPopup(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Funções de pesquisa

  // Executa a consulta com o CPF informado (ou o digitado no input)
  const pesquisar = async (cpfOverride) => {
    const term = (cpfOverride ?? cpfInput).trim();
    if (!term) return;

    setMostrarPopup(false);
    setLoading(true);
    setCliente(null);
    setErro(null);

    const res = await getClientePorCpf(term);
    setLoading(false);

    if (res.status === 200) {
      setCliente(res.data);
    } else {
      setErro(res.message || "Cliente não encontrado.");
    }
  };

  // Clique em uma sugestão do popup
  const selecionarSugestao = (c) => {
    setCpfInput(c.cpf);
    setMostrarPopup(false);
    pesquisar(c.cpf);
  };

  // Formatadores
  const fmtBRL = (v) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cpfMask = (cpf) =>
    String(cpf).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

  // Controla se os painéis de dados estão ativos
  const temDados = !!cliente;

  return (
    <div className="flex flex-col w-full gap-6 py-10 px-6">
      {/* Cabeçalho */}
      <div className="rounded-sm relative h-fit w-full px-6 py-4 overflow-hidden shadow-black/30 shadow-inner z-[15]">
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
        <WaveSimpleRedReverse className="z-[-3]" />
        <div className="rounded-md bg-black/50 shadow-black/60 shadow-inner px-4 py-3 w-fit h-fit select-none z-[200]">
          <h2 className="text-white text-2xl font-orienta">
            Consulta de Cliente
          </h2>
          <p className="text-secundary text-sm font-inter mt-1">
            Informe o CPF para consultar qualquer cliente cadastrado
          </p>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex gap-2 flex-col xl:flex-row select-none">
        <div className="relative flex-1" ref={inputWrapRef}>
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-secundary pointer-events-none z-10"
          />
          <input
            type="text"
            value={cpfInput}
            onChange={(e) => {
              setCpfInput(e.target.value);
              setMostrarPopup(true);
            }}
            onKeyDown={(e) => e.key === "Enter" && pesquisar()}
            onFocus={() => sugestoes.length > 0 && setMostrarPopup(true)}
            placeholder="Digite o CPF do cliente"
            className="w-full pl-10 pr-4 py-3 rounded-sm bg-brandDark border-2 border-secundary/60
                       text-white placeholder-secundary font-inter text-sm
                       focus:outline-none focus:border-secundary transition-colors"
          />

          {/* Popup de sugestões */}
          {mostrarPopup && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-brandDark border-2 border-secundary/60
                         rounded-sm overflow-hidden shadow-2xl shadow-black/70 z-50"
            >
              {sugestoes.map((s) => (
                <button
                  key={s.cpf}
                  onMouseDown={() => selecionarSugestao(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand/40
                             text-left transition-colors border-b border-secundary/60 last:border-0"
                >
                  <UserRoundSearch
                    size={20}
                    className="text-secundary shrink-0"
                  />
                  <span className="text-secundary font-mono text-sm shrink-0">
                    {cpfMask(s.cpf)}
                  </span>
                  <span className="text-white text-sm truncate">{s.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => pesquisar()}
          className="px-6 py-3 bg-secundary/20 hover:bg-secundary/60 active:bg-secundary/80
                    border border-secundary
                    text-white font-inter font-semibold rounded-sm transition-colors
                    whitespace-nowrap hidden xl:block"
        >
          Buscar
        </button>
      </div>

      {/* Carregando */}
      {loading && (
        <div className="flex justify-center py-8 select-none">
          <LoaderCircle size={48} className="text-secundary animate-spin" />
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div
          className="flex items-center justify-center gap-3 bg-red-900/50 border border-red-600
                     rounded-xl px-6 py-4 text-brand font-inter text-sm"
        >
          <UserRoundX size={22} className="shrink-0 select-none" />
          {erro}
        </div>
      )}

      {/* Painéis de dados */}
      <div
        className={`flex flex-col gap-4 transition-all duration-300 select-none
                    ${temDados ? "opacity-100" : "opacity-35 pointer-events-none select-none"}`}
      >
        {/* Dados Pessoais */}
        <div className="bg-brandDark border-2 border-secundary rounded-sm p-5">
          <h3
            className="text-secundary font-semibold font-inter mb-4 text-sm uppercase
                       tracking-wider border-b border-secundary/60 pb-2"
          >
            Dados Pessoais
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Campo label="CPF" value={temDados ? cpfMask(cliente.cpf) : "—"} />
            <Campo label="Nome" value={temDados ? cliente.nome : "—"} />
            <Campo label="Telefone" value={temDados ? cliente.telefone : "—"} />
            <Campo label="E-mail" value={temDados ? cliente.email : "—"} />
            <Campo
              label="Salário"
              value={temDados ? fmtBRL(cliente.salario) : "—"}
            />
            <Campo label="Endereço" value={temDados ? cliente.endereco : "—"} />
            <Campo
              label="Cidade / UF"
              value={temDados ? `${cliente.cidade}, ${cliente.estado}` : "—"}
            />
          </div>
        </div>

        {/* Dados da Conta */}
        <div className="bg-brandDark border-2 border-secundary rounded-sm p-5">
          <h3
            className="text-secundary font-semibold font-inter mb-4 text-sm uppercase
                       tracking-wider border-b border-secundary/60 pb-2"
          >
            Dados da Conta
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Campo label="Nº Conta" value={temDados ? cliente.conta : "—"} />
            <Campo
              label="Saldo"
              value={temDados ? fmtBRL(cliente.saldo) : "—"}
              highlight
            />
            <Campo
              label="Limite"
              value={temDados ? fmtBRL(cliente.limite) : "—"}
              highlight
            />
          </div>
        </div>

        {/* Gerente Responsável */}
        <div className="bg-brandDark border-2 border-secundary rounded-sm p-5">
          <h3
            className="text-secundary font-semibold font-inter mb-4 text-sm uppercase
                       tracking-wider border-b border-secundary/60 pb-2"
          >
            Gerente Responsável
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Campo
              label="CPF do Gerente"
              value={
                temDados && cliente.gerente ? cpfMask(cliente.gerente) : "—"
              }
            />
            <Campo
              label="Nome do Gerente"
              value={temDados ? cliente.gerente_nome || "—" : "—"}
            />
            <Campo
              label="E-mail do Gerente"
              value={temDados ? cliente.gerente_email || "—" : "—"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Campos
function Campo({ label, value, highlight = false }) {
  return (
    <button
      onClick={() =>
        value !== "—" && navigator.clipboard.writeText(String(value))
      }
      className={`group cursor-pointer text-left p-3 rounded-lg border-2 transition-colors
                  ${
                    highlight
                      ? "bg-brand/60 border-secundary/80 hover:border-secundary"
                      : "bg-brand/30 border-secundaryDark/70 hover:border-secundaryDark"
                  }`}
    >
      <span className="text-secundary font-semibold font-inter text-xs block mb-1">
        {label}
      </span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-white font-inter text-sm">{value}</span>
        {value !== "—" && (
          <Copy
            size={14}
            className="text-secundary font-semibold font-inter text-xs block mb-1"
          />
        )}
      </div>
    </button>
  );
}
