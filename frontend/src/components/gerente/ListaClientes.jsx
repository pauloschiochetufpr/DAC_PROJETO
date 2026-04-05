import { useState, useEffect, useMemo } from "react";
import { useGerente } from "../../hooks/useGerente";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

export default function ListaClientes({ idGerente }) {
  const { getClientesFiltrados } = useGerente();

  // Estado local
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  // CPF do cliente com detalhes expandidos (null = nenhum)
  const [expandido, setExpandido] = useState(null);

  // ── Busca inicial e re-busca quando o mock muda ───────────────────────
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

  // ── Filtragem local por CPF ou Nome ───────────────────────────────────
  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes;

    const termo = busca.trim().toLowerCase();
    return clientes.filter(
      (c) => c.cpf.includes(termo) || c.nome.toLowerCase().includes(termo),
    );
  }, [clientes, busca]);

  // ── Formatadores ──────────────────────────────────────────────────────
  const fmtBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cpfMask = (cpf) =>
    cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

  // ── Toggle de expansão ────────────────────────────────────────────────
  const toggleExpandido = (cpf) =>
    setExpandido((prev) => (prev === cpf ? null : cpf));

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full">
      {/* Cabeçalho da seção */}
      <h2
        className="font-long-cang text-3xl md:text-4xl text-secundary mb-4
                    select-none text-center xl:text-left"
      >
        Meus Clientes
      </h2>

      {/* Campo de pesquisa */}
      <div className="relative mb-3">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-contrastDark pointer-events-none"
        />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por CPF ou Nome…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-brandDark/80 border border-secundaryDark/40
                     text-contrast placeholder-contrastDark font-inter text-sm
                     focus:outline-none focus:border-secundary/60 transition-colors"
        />
      </div>

      {/* Estado de carregamento / erro / vazio */}
      {loading && (
        <p className="text-contrastDark font-inter text-center py-8">
          Carregando clientes…
        </p>
      )}

      {erro && (
        <p className="text-red-400 font-inter text-center py-8">{erro}</p>
      )}

      {!loading && !erro && clientesFiltrados.length === 0 && (
        <p className="text-contrastDark font-inter text-center py-8">
          {busca.trim()
            ? "Nenhum cliente corresponde à pesquisa."
            : "Nenhum cliente cadastrado."}
        </p>
      )}

      {/* Tabela de clientes */}
      {!loading && !erro && clientesFiltrados.length > 0 && (
        <div
          className="overflow-y-auto max-h-[32rem] xl:max-h-[38rem] rounded-xl border border-secundaryDark/40
                      scrollbar-thin scrollbar-thumb-secundary scrollbar-track-brandDark"
        >
          <table className="w-full text-left font-inter text-sm md:text-base">
            {/* Cabeçalho */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-brandDark/90 border-b border-secundaryDark/40">
                <th className="px-3 py-3 text-secundary font-semibold">CPF</th>
                <th className="px-3 py-3 text-secundary font-semibold">Nome</th>
                <th className="px-3 py-3 text-secundary font-semibold hidden md:table-cell">
                  Cidade
                </th>
                <th className="px-3 py-3 text-secundary font-semibold hidden md:table-cell">
                  UF
                </th>
                <th className="px-3 py-3 text-secundary font-semibold hidden sm:table-cell text-right">
                  Saldo
                </th>
                <th className="px-3 py-3 text-secundary font-semibold hidden sm:table-cell text-right">
                  Limite
                </th>
                <th className="px-3 py-3 w-10"></th>
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
                    className={`border-b border-brandDark/60 cursor-pointer transition-colors
                      ${expandido === c.cpf ? "bg-brand/25" : "hover:bg-brand/15"}`}
                  >
                    <td className="px-3 py-3 text-contrast font-mono text-xs md:text-sm whitespace-nowrap">
                      {cpfMask(c.cpf)}
                    </td>
                    <td className="px-3 py-3 text-contrast">{c.nome}</td>
                    <td className="px-3 py-3 text-contrast hidden md:table-cell">
                      {c.cidade}
                    </td>
                    <td className="px-3 py-3 text-contrast hidden md:table-cell">
                      {c.estado}
                    </td>
                    <td className="px-3 py-3 text-contrast hidden sm:table-cell text-right whitespace-nowrap">
                      {fmtBRL(c.saldo)}
                    </td>
                    <td className="px-3 py-3 text-contrast hidden sm:table-cell text-right whitespace-nowrap">
                      {fmtBRL(c.limite)}
                    </td>
                    <td className="px-3 py-3 text-contrastDark text-center">
                      {expandido === c.cpf ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </td>
                  </tr>

                  {/* Linha expandida — detalhes completos */}
                  {expandido === c.cpf && (
                    <tr key={`${c.cpf}-detalhe`} className="bg-brandDark/50">
                      <td colSpan={7} className="px-4 py-4">
                        <div
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2
                                      text-sm font-inter"
                        >
                          <Detail label="CPF" value={cpfMask(c.cpf)} />
                          <Detail label="Nome" value={c.nome} />
                          <Detail label="Telefone" value={c.telefone} />
                          <Detail label="E-mail" value={c.email} />
                          <Detail label="Salário" value={fmtBRL(c.salario)} />
                          <Detail label="Endereço" value={c.endereco} />
                          <Detail
                            label="Cidade / UF"
                            value={`${c.cidade} – ${c.estado}`}
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
      )}
    </div>
  );
}

// Campo de detalhe (label + valor)
function Detail({ label, value }) {
  return (
    <p className="text-contrastDark">
      <span className="text-secundary font-semibold">{label}: </span>
      <span className="text-contrast">{value}</span>
    </p>
  );
}
