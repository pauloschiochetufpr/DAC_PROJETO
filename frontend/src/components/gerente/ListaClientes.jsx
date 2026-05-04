import { useState, useEffect, useMemo } from "react";

// Mock's
import { useGerente } from "../../hooks/useGerente";

//i18n
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../lib/i18n";

// Lucide
import {
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Bug,
  BookUser,
  LoaderCircle,
} from "lucide-react";

// SVG's
import WaveSimpleRed from "../WaveSimpleRed";

export default function ListaClientes({ idGerente }) {
  const { lang } = useLanguage();
  const { getClientesFiltrados } = useGerente();

  // States
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");

  // CPF do cliente com detalhes expandidos (null = nenhum selecionado)
  const [expandido, setExpandido] = useState(null);

  // Busca inicial e re-busca quando o mock muda (vai ficar bem diferernte na final)

  useEffect(() => {
    let cancelado = false;

    getClientesFiltrados("meus_clientes", idGerente).then((res) => {
      if (cancelado) return;
      if (res.status === 200) {
        setClientes(res.data);
        setErro(null);
      } else {
        setErro(res.message || "Erro ao buscar clientes.");
      }
      setLoading(false);
    });

    return () => {
      cancelado = true;
    };
  }, [getClientesFiltrados, idGerente]);

  // Busca por CPF ou Nome (Local apenas, a lista já está ai mesmo)
  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes;

    const termo = busca.trim().toLowerCase();
    return clientes.filter(
      (c) => c.cpf.includes(termo) || c.nome.toLowerCase().includes(termo),
    );
  }, [clientes, busca]);

  // Formatadores
  const fmtBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cpfMask = (cpf) =>
    cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

  // Funções de interface

  // Toggle de expansão de detealhes
  const toggleExpandido = (cpf) =>
    setExpandido((prev) => (prev === cpf ? null : cpf));

  return (
    <div className="flex flex-col w-full h-full gap-8 relative">
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
            {t(lang, "GerenteListaClientes.title")}
          </div>
        </div>
      </div>

      {/* Campo de pesquisa */}
      <div className="relative mx-4 select-none">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-contrastDark pointer-events-none"
        />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={t(lang, "GerenteListaClientes.search_placeholder")}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brandDark/80 border border-secundaryDark/40
                     text-contrast placeholder-contrastDark font-inter text-sm
                     focus:outline-none focus:border-secundary/60 transition-colors"
        />
      </div>

      {/* Estado de carregamento / erro / vazio */}
      {loading && (
        <p className="text-secundary w-full h-full flex items-center justify-center absolute">
          <div className="h-fit w-fit animate-pulse transition-transform ease-in-out">
            <LoaderCircle size={65} className="animate-spin" />
          </div>
        </p>
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

      {!loading && !erro && clientesFiltrados.length === 0 && (
        <p className="text-contrastDark font-inter text-center">
          {busca.trim() ? (
            <div className="py-8">
              {t(lang, "GerenteListaClientes.no_results")}
            </div>
          ) : (
            <div
              className="text-red-400 font-inter text-center text-base md:text-xl
              pb-8 md:pt-40  flex flex-col items-center justify-center gap-2 w-full select-none"
            >
              <BookUser size={65} className="inline-block mr-2" />
              {t(lang, "GerenteListaClientes.no_clients")}
            </div>
          )}
        </p>
      )}

      {/* Tabela de clientes */}
      {!loading && !erro && clientesFiltrados.length > 0 && (
        <div className="w-full h-full overflow-hidden p-4 pt-0">
          <div className="w-full h-full rounded-xl overflow-hidden border border-secundaryDark/40">
            <div
              className="overflow-y-auto w-full h-full
                      scrollbar-thin scrollbar-thumb-secundary scrollbar-track-brandDark
                      md:overscroll-none"
            >
              <table className="w-full text-center font-inter text-sm md:text-base select-none">
                {/* Cabeçalho */}
                <thead className="sticky top-0 z-10">
                  <tr className="bg-brandDark/90 border-b border-secundaryDark/40">
                    <th className=" py-3 text-secundary font-semibold">CPF</th>
                    <th className=" py-3 text-secundary font-semibold">
                      {t(lang, "GerenteListaClientes.table.name")}
                    </th>
                    <th className=" py-3 text-secundary font-semibold hidden md:table-cell">
                      {t(lang, "GerenteListaClientes.table.city")}
                    </th>
                    <th className=" py-3 text-secundary font-semibold hidden md:table-cell">
                      UF
                    </th>
                    <th className=" py-3 text-secundary font-semibold hidden sm:table-cell text-right">
                      {t(lang, "GerenteListaClientes.table.balance")}
                    </th>
                    <th className=" py-3 text-secundary font-semibold hidden sm:table-cell text-right">
                      {t(lang, "GerenteListaClientes.table.limit")}
                    </th>
                    <th className="py-3"></th>
                  </tr>
                </thead>

                {/* Corpo */}
                <tbody>
                  {clientesFiltrados.map((c) => (
                    <>
                      {/* Linha resumo */}
                      <tr
                        key={c.cpf}
                        onClick={() => toggleExpandido(c.cpf)}
                        className={`border-b border-brandDark/60 cursor-pointer transition-colors select-none
                                    
                      ${expandido === c.cpf ? "bg-brand/25" : "hover:bg-brand/15 transition-colors duration-200"}`}
                      >
                        <td className=" py-3 text-contrast font-mono text-xs md:text-sm whitespace-nowrap">
                          {cpfMask(c.cpf)}
                        </td>
                        <td className=" py-3 text-contrast">{c.nome}</td>
                        <td className=" py-3 text-contrast hidden md:table-cell">
                          {c.cidade}
                        </td>
                        <td className=" py-3 text-contrast hidden md:table-cell">
                          {c.estado}
                        </td>
                        <td className=" py-3 text-contrast hidden sm:table-cell text-right whitespace-nowrap">
                          {fmtBRL(c.saldo)}
                        </td>
                        <td className="py-3 text-contrast hidden sm:table-cell text-right whitespace-nowrap">
                          {fmtBRL(c.limite)}
                        </td>
                        <td className=" py-3 pl-2 text-contrastDark text-center">
                          {expandido === c.cpf ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </td>
                      </tr>

                      {/* Detalhes */}
                      {expandido === c.cpf && (
                        <tr
                          key={`${c.cpf}-detalhe`}
                          className="bg-brandDark/50"
                        >
                          <td colSpan={7} className="sm:pl-16 px-4 py-4">
                            <div
                              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2
                                      text-sm font-inter text-left"
                            >
                              <Detail label="CPF" value={cpfMask(c.cpf)} />
                              <Detail label="Nome" value={c.nome} />
                              <Detail label="Telefone" value={c.telefone} />
                              <Detail label="E-mail" value={c.email} />
                              <Detail
                                label="Salário"
                                value={fmtBRL(c.salario)}
                              />
                              <Detail label="Endereço" value={c.endereco} />
                              <Detail
                                label="Cidade / UF"
                                value={`${c.cidade}, ${c.estado}`}
                              />
                              <Detail label="Conta" value={c.conta} />
                              <Detail label="Saldo" value={fmtBRL(c.saldo)} />
                              <Detail label="Limite" value={fmtBRL(c.limite)} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Campo de detalhe (label + valor)
function Detail({ label, value }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(String(value))}
      className="group cursor-pointer text-xs 2xl:text-sm relative overflow-hidden
    text-contrastDark flex flex-col 2xl:flex-row gap-2 p-2 border-2 border-black/20 rounded-sm select-none"
    >
      <span className="text-secundary font-semibold 2xl:text-center text-left">
        {label} |{" "}
      </span>
      <div className="flex flex-row gap-1 2xl:gap-2 items-center">
        <span className="text-contrast">{value}</span>
        <div
          className="group-hover:text-white transition-colors duration-75 2xl:pl-1
                           absolute top-2 right-2 2xl:static"
        >
          <Copy size={16} />
        </div>
      </div>
    </button>
  );
}
