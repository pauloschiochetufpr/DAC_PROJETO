import { useState, useEffect, useRef, useCallback } from "react";

// i18n
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../lib/i18n";

// Mock's
import {
  getClientesAdminPaginado,
  searchClientesAdmin,
} from "../../mocks/adminMockData";

// Lucide
import { Search, X, Bug, LoaderCircle, UserRoundSearch } from "lucide-react";

// SVG's
import WaveSimpleRed from "../WaveSimpleRed";

// Formatadores
const fmtBRL = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const cpfMask = (cpf) =>
  cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

// Crédito: randomizado uma vez por CPF (Para mostrar funcionalidade)
const creditoCache = new Map();
const getCreditoPct = (cpf) => {
  if (!creditoCache.has(cpf))
    creditoCache.set(cpf, Math.floor(Math.random() * 101));
  return creditoCache.get(cpf);
};

// Crédito style's
const corCredito = (pct) => {
  if (pct >= 70) return "bg-green-500";
  if (pct >= 40) return "bg-yellow-500";
  return "bg-red-500";
};

const LIMITE_INICIAL = 15;
const LIMITE_MAIS = 10;

export default function ClientesAdminLista() {
  // State da língua
  const { lang } = useLanguage();

  // Lazy load states
  const offsetRef = useRef(0);
  const [itens, setItens] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [erroLoad, setErroLoad] = useState(null);

  // Autocomplete states
  const [inputBusca, setInputBusca] = useState("");
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [loadingPopup, setLoadingPopup] = useState(false);

  // Filtro (seleção do popup ou Enter)
  const [modoFiltro, setModoFiltro] = useState(false);
  const [clientesFiltro, setClientesFiltro] = useState([]);

  // Ref para detectar clique fora do input ou popup
  const inputWrapRef = useRef(null);

  // Simulação http GET /admin/clientes paginado
  useEffect(() => {
    let ok = true;
    getClientesAdminPaginado(0, LIMITE_INICIAL).then((res) => {
      if (!ok) return;
      if (res.status === 200) {
        setItens(res.data);
        setHasMore(res.hasMore);
        offsetRef.current = LIMITE_INICIAL;
      } else {
        setErroLoad(res.message || "Erro ao carregar clientes.");
      }
      setLoadingInit(false);
    });
    return () => {
      ok = false;
    };
  }, []);

  // Autocomplete com debounce:
  // + Observa "inputBusca" e aguarda um curto timeout antes de disparar a chamada de busca.
  // + Quando o termo é vazio, limpa imediatamente as sugestões e o estado de loading.
  // + Quando há termo, define "loading" e executa "searchClientesAdmin", atualizando "sugestoes"
  //   e "loadingPopup" dentro do callback para manter estados consistentes e evitar condições
  //   de corrida do React ( Que é o estado atualizado apenas quando a resposta chega).
  // + O timeout é cancelado no cleanup para que múltiplas digitações rápidas não disparem
  //   várias requisições simultâneas.
  useEffect(() => {
    const termo = inputBusca.trim();
    const timer = setTimeout(
      () => {
        if (!termo) {
          setSugestoes([]);
          setLoadingPopup(false);
          return;
        }
        setLoadingPopup(true);
        searchClientesAdmin(termo, 8).then((res) => {
          setSugestoes(res.status === 200 ? res.data : []);
          setLoadingPopup(false);
        });
      },
      termo ? 180 : 0,
    );
    return () => clearTimeout(timer);
  }, [inputBusca]);

  // Fecha popup ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (inputWrapRef.current && !inputWrapRef.current.contains(e.target))
        setMostrarPopup(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Carrega mais itens | lazyLoading
  const carregarMais = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    getClientesAdminPaginado(offsetRef.current, LIMITE_MAIS).then((res) => {
      if (res.status === 200) {
        setItens((prev) => [...prev, ...res.data]);
        setHasMore(res.hasMore);
        offsetRef.current += LIMITE_MAIS;
      }
      setLoadingMore(false);
    });
  }, [loadingMore, hasMore]);

  // Scroll desktop | carrega mais no fim da lista (LazyLoading sem botão "Carregar mais")
  const handleScroll = (e) => {
    if (modoFiltro || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 48) carregarMais();
  };

  // Enter para busca completa
  const handleEnter = () => {
    const termo = inputBusca.trim();
    if (!termo) {
      limparFiltro();
      return;
    }
    setMostrarPopup(false);
    searchClientesAdmin(termo, 0).then((res) => {
      if (res.status === 200 && res.data.length > 0) {
        setClientesFiltro(res.data);
        setModoFiltro(true);
      } else {
        // Nenhum resultado, abre popup para mostrar a mensagem
        setMostrarPopup(true);
      }
    });
  };

  // Seleção no popup
  const selecionarCliente = (c) => {
    setInputBusca(c.nome);
    setMostrarPopup(false);
    setClientesFiltro([c]);
    setModoFiltro(true);
  };

  // Limpar filtro e voltar para lista completa default
  const limparFiltro = () => {
    setInputBusca("");
    setModoFiltro(false);
    setClientesFiltro([]);
    setSugestoes([]);
    setMostrarPopup(false);
  };

  // Decide quais itens mostrar na tabela de acordo coma flag "MmodoFiltro"
  const itensTabela = modoFiltro ? clientesFiltro : itens;

  return (
    <div className="flex flex-col w-full h-fit xl:h-full">
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
            {t(lang, "ClientesAdminLista.title")}
          </div>
        </div>
      </div>

      {/* Barra de pesquisa com autocomplete */}
      <div className="relative mx-4 mt-4 flex-shrink-0" ref={inputWrapRef}>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-contrastDark pointer-events-none z-10"
        />
        <input
          type="text"
          value={inputBusca}
          onChange={(e) => {
            setInputBusca(e.target.value);
            setMostrarPopup(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEnter();
            if (e.key === "Escape") setMostrarPopup(false);
          }}
          onFocus={() => inputBusca.trim() && setMostrarPopup(true)}
          placeholder={t(lang, "ClientesAdminLista.search_placeholder")}
          className="w-full pl-9 pr-9 py-2 rounded-xl bg-brandDark/80 border border-secundaryDark/40
                     text-contrast placeholder-contrastDark font-inter text-sm
                     focus:outline-none focus:border-secundary/60 transition-colors"
        />
        {/* Limpar filtro */}
        {(modoFiltro || inputBusca) && (
          <button
            onClick={limparFiltro}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-contrastDark hover:text-contrast transition-colors"
          >
            <X size={14} />
          </button>
        )}

        {/* Popup de autocomplete */}
        {mostrarPopup && inputBusca.trim() && (
          <div
            className="absolute top-full left-0 right-0 mt-1
                       bg-brandDark border border-secundaryDark/60
                       rounded-xl overflow-hidden shadow-2xl shadow-black/70 z-50"
          >
            {loadingPopup && (
              <div className="flex justify-center py-3">
                <LoaderCircle
                  size={20}
                  className="text-secundary animate-spin"
                />
              </div>
            )}

            {!loadingPopup && sugestoes.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 text-contrastDark font-inter text-sm select-none">
                <UserRoundSearch size={16} className="shrink-0" />
                {t(lang, "ClientesAdminLista.results.no_results")} &quot;
                {inputBusca}&quot;
              </div>
            )}

            {!loadingPopup &&
              sugestoes.map((s) => (
                <button
                  key={s.cpf}
                  onMouseDown={() => selecionarCliente(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand/30
                             text-left transition-colors border-b border-secundaryDark/30 last:border-0"
                >
                  <UserRoundSearch
                    size={15}
                    className="text-secundary shrink-0"
                  />
                  <span className="font-mono text-xs text-secundary shrink-0">
                    {cpfMask(s.cpf)}
                  </span>
                  <span className="font-inter text-sm text-contrast truncate">
                    {s.nome}
                  </span>
                </button>
              ))}
          </div>
        )}

        {/* Pill indicando filtro ativo */}
        {modoFiltro && (
          <div className="absolute -bottom-5 left-0 font-inter text-[10px] text-secundary/70 select-none">
            {clientesFiltro.length === 1
              ? `1 ${t(lang, "ClientesAdminLista.results.client-found")}`
              : `${clientesFiltro.length} ${t(lang, "ClientesAdminLista.results.clients-found")}`}
          </div>
        )}
      </div>

      {/* Espaço do pill */}
      {modoFiltro && <div className="flex-shrink-0 h-6" />}

      {/* Loading inicial */}
      {loadingInit && (
        <div className="flex-1 flex items-center justify-center py-10 select-none">
          <LoaderCircle size={60} className="text-secundary animate-spin" />
        </div>
      )}

      {/* Erro */}
      {erroLoad && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-red-400 font-inter py-10">
          <Bug size={60} className="select-none" />
          <span className="text-center">{erroLoad}</span>
        </div>
      )}

      {/* Tabela */}
      {!loadingInit && !erroLoad && (
        <div className="xl:flex-1 xl:min-h-0 overflow-hidden px-3 pt-3 pb-3">
          <div className="xl:h-full rounded-xl border border-secundaryDark/40 overflow-hidden">
            <div
              onScroll={handleScroll}
              className="xl:h-full xl:overflow-y-auto overscroll-none
                         scrollbar-thin scrollbar-thumb-secundary scrollbar-track-brandDark"
            >
              <table className="w-full table-fixed text-left font-inter text-xs select-none">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-brandDark/95 border-b border-secundaryDark/40">
                    <th className="px-3 py-2.5 text-secundary font-semibold whitespace-nowrap">
                      {t(lang, "ClientesAdminLista.table.name")}
                    </th>
                    <th className="px-2 py-2.5 text-secundary font-semibold whitespace-nowrap hidden sm:table-cell">
                      {t(lang, "ClientesAdminLista.table.cpfConta")}
                    </th>
                    <th className="px-2 py-2.5 text-secundary font-semibold whitespace-nowrap hidden sm:table-cell">
                      {t(lang, "ClientesAdminLista.table.balance")}
                    </th>
                    <th className="px-2 py-2.5 text-secundary font-semibold whitespace-nowrap hidden sm:table-cell">
                      {t(lang, "ClientesAdminLista.table.manager")}
                    </th>
                    <th className="px-2 py-2.5 text-secundary font-semibold whitespace-nowrap">
                      {t(lang, "ClientesAdminLista.table.credit")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itensTabela.map((c, idx) => (
                    <LinhaCliente key={c.cpf} cliente={c} par={idx % 2 === 0} />
                  ))}
                </tbody>
              </table>

              {/* Spinner de carregando mais */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <LoaderCircle
                    size={22}
                    className="text-secundary animate-spin select-none"
                  />
                </div>
              )}

              {/* Botão "Carregar mais"| Mobile */}
              {!modoFiltro && hasMore && !loadingMore && (
                <div className="flex justify-center py-5 xl:hidden">
                  <button
                    onClick={carregarMais}
                    className="px-8 py-4 rounded-xl bg-brandDark border border-secundaryDark/50
                               text-secundary font-inter text-base hover:bg-brand/30 transition-colors
                               shadow-md shadow-black/30
                               active:bg-gradient-t-r active:from-brandDark/100 active:to-brand/100"
                  >
                    Carregar mais
                  </button>
                </div>
              )}

              {/* Fim da lista */}
              {!modoFiltro && !hasMore && itens.length > 0 && (
                <div className="py-6 text-center font-inter text-[10px] text-contrastDark/90 select-none">
                  {itens.length} clientes carregados
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Linha do cliente
function LinhaCliente({ cliente, par }) {
  // variaveis da linha
  const creditoPct = getCreditoPct(cliente.cpf);
  const saldoNegativo = cliente.saldo < 0;

  return (
    <tr
      className={`border-b border-secundaryDark/15 transition-colors hover:bg-white/[0.04]
                    ${par ? "bg-black/10" : "bg-transparent"}`}
    >
      {/* Primeiras infos */}
      <td className="px-3 py-2.5 min-w-0 align-middle">
        <div
          className="font-orienta text-contrast text-xs truncate max-w-[10rem]"
          title={cliente.nome}
        >
          {cliente.nome}
        </div>
        <div
          className="text-contrastDark text-[10px] truncate max-w-[10rem] hidden sm:block"
          title={cliente.email}
        >
          {cliente.email}
        </div>
      </td>

      {/* Dados sensíveis */}
      <td className="px-2 py-2.5 text-contrast whitespace-nowrap hidden sm:table-cell align-middle">
        <div>{cpfMask(cliente.cpf)}</div>
        <div className="text-contrastDark hidden md:block">{cliente.conta}</div>
      </td>

      {/* Saldos */}
      <td
        className={`px-2 py-2.5 whitespace-nowrap hidden sm:table-cell align-middle`}
      >
        <div
          className={`font-medium ${saldoNegativo ? "text-red-400" : "text-green-400"}`}
        >
          {saldoNegativo ? "-" : ""}
          {fmtBRL(Math.abs(cliente.saldo))}
        </div>
        <div className="text-contrastDark hidden sm:block">
          {fmtBRL(cliente.salario)}
        </div>
      </td>

      {/* gerente */}
      <td className="px-2 py-2.5 hidden sm:table-cell align-middle">
        <div className="text-contrast text-[10px] truncate max-w-[8rem]">
          {cliente.gerente_nome}
        </div>
        <div className="text-contrastDark text-[10px]">
          {cpfMask(cliente.gerente_cpf)}
        </div>
      </td>

      {/* Percentual de crédito */}
      <td className="px-2 py-2.5 align-middle">
        <div className="flex items-center gap-1.5 min-w-[5rem]">
          <div className="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${corCredito(creditoPct)}`}
              style={{ width: `${creditoPct}%` }}
            />
          </div>
          <span className="text-contrastDark text-[10px] w-7 text-right flex-shrink-0">
            {creditoPct}%
          </span>
        </div>
      </td>
    </tr>
  );
}
