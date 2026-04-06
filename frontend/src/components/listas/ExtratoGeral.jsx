import React, { useState, useEffect, useCallback, useMemo } from "react";

// Mock's
import { useBanco } from "../../hooks/useBanco";

// Utilitários
import { formatarData } from "../../lib/dataUtils";

// Lucide
import {
  BanknoteArrowUp,
  BanknoteArrowDown,
  HandCoins,
  Calendar,
  LoaderCircle,
  AlertCircle,
  Search,
  Wallet,
} from "lucide-react";

// Fake HTTP
function fetchExtrato(numeroConta, movimentacoes, saldo) {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          status: 200,
          data: { conta: numeroConta, saldo, movimentacoes },
        }),
      600 + Math.random() * 400,
    );
  });
}

//  Funções auxiliares ultra-especificas
const calcularDelta = (tipo, origem, valor, conta) => {
  switch (tipo) {
    case "deposito":
      return valor;
    case "saque":
      return -valor;
    case "transferencia":
      return origem === conta ? -valor : valor;
    default:
      return 0;
  }
};

const ehEntrada = (tipo, destino, conta) => {
  if (tipo === "deposito") return true;
  if (tipo === "transferencia") return destino === conta;
  return false;
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

// Labels de interface

const TIPOS = ["todos", "deposito", "saque", "transferencia"];

const TIPO_LABEL = {
  todos: "Todos",
  deposito: "Depósito",
  saque: "Saque",
  transferencia: "Transferência",
};

const IconeTipo = ({ tipo, className }) => {
  const p = { size: 18, className };
  switch (tipo) {
    case "deposito":
      return <BanknoteArrowDown {...p} />;
    case "saque":
      return <BanknoteArrowUp {...p} />;
    case "transferencia":
      return <HandCoins {...p} />;
    default:
      return null;
  }
};

// Formatadores
const fmtBRL = (v) =>
  Math.abs(Number(v)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Retorna array de data (YYYY-MM-DD) do fim ao início (Mais recente primeiro obviamente)
const enumerarDias = (inicio, fim) => {
  const dias = [];
  const cur = new Date(fim);
  const start = new Date(inicio);
  while (cur >= start) {
    dias.push(toDateStr(cur));
    cur.setDate(cur.getDate() - 1);
  }
  return dias;
};

// Formatador padronizado ( Date() )
const fmtDiaHeader = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Saldo ao fim de cada dia
const saldoNoFimDoDia = (dateStr, todasMovs, saldoAtual, conta) => {
  const dayEnd = new Date(dateStr + "T23:59:59-03:00");
  const delta = todasMovs
    .filter((m) => new Date(m.data) > dayEnd)
    .reduce(
      (acc, m) => acc + calcularDelta(m.tipo, m.origem, m.valor, conta),
      0,
    );
  return Number((saldoAtual - delta).toFixed(2));
};

export default function ExtratoGeral() {
  // Mock
  const { conta, saldo, movimentacoes } = useBanco();

  // Estados de filtro | Período padrão filtro de tempo = 30 dias atrás
  const hoje = useMemo(() => new Date(), []);
  const [dataFim, setDataFim] = useState(toDateStr(hoje));
  const [dataInicio, setDataInicio] = useState(toDateStr(addDays(hoje, -30)));
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Estados de interface
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);

  // Simulação HTTP
  const consultar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetchExtrato(conta, movimentacoes, saldo);
      if (res.status === 200) {
        setResultado(res.data);
      } else if (res.status === 401) {
        setErro({ code: 401, msg: "Sessão expirada. Faça login novamente." });
      } else if (res.status === 403) {
        setErro({
          code: 403,
          msg: "Você não tem permissão para consultar este extrato.",
        });
      } else {
        setErro({
          code: res.status,
          msg: "Erro ao consultar extrato. Tente novamente.",
        });
      }
    } catch {
      setErro({ code: 0, msg: "Falha de conexão. Verifique sua internet." });
    } finally {
      setLoading(false);
    }
  }, [conta, movimentacoes, saldo]);

  // Consulta inicial ao montar | Linha de desativação de corretor do compilador abaixo (Não retirar)
  useEffect(() => {
    consultar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  //  Presets de data
  const setPreset = (dias) => {
    const fim = new Date();
    setDataFim(toDateStr(fim));
    setDataInicio(toDateStr(addDays(fim, -dias)));
  };

  //  Dados processados por dia
  const diasData = useMemo(() => {
    if (!resultado) return [];
    const inicioDate = new Date(dataInicio + "T00:00:00-03:00");
    const fimDate = new Date(dataFim + "T23:59:59-03:00");
    if (inicioDate > fimDate) return [];

    return enumerarDias(dataInicio, dataFim).map((dia) => {
      const diaStart = new Date(dia + "T00:00:00-03:00");
      const diaEnd = new Date(dia + "T23:59:59-03:00");

      const todasDoDia = resultado.movimentacoes.filter((m) => {
        const d = new Date(m.data);
        return d >= diaStart && d <= diaEnd;
      });

      const movsExibir = (
        filtroTipo === "todos"
          ? todasDoDia
          : todasDoDia.filter((m) => m.tipo === filtroTipo)
      ).sort((a, b) => new Date(b.data) - new Date(a.data));

      const saldoDia = saldoNoFimDoDia(
        dia,
        resultado.movimentacoes,
        resultado.saldo,
        conta,
      );

      return {
        dia,
        movsExibir,
        saldoDia,
        temMovimentos: todasDoDia.length > 0,
      };
    });
  }, [resultado, dataInicio, dataFim, filtroTipo, conta]);

  // Validação de datas
  const dataInvalida = dataInicio > dataFim;

  return (
    <div
      className="w-full flex flex-col xl:flex-row
                 pt-[10rem] md:pt-[12rem]
                 xl:h-screen xl:overflow-hidden"
    >
      {/*  Painel de configuração  */}
      <aside
        className="xl:w-[340px] xl:flex-shrink-0
                   xl:h-full xl:overflow-y-auto
                   bg-brandDark
                   border-b xl:border-b-0 xl:border-r border-secundary/25
                   flex flex-col gap-6 px-5 py-6 xl:py-8"
      >
        {/* Título */}
        <div className="flex flex-col gap-1 select-none">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-secundary" />
            <h2 className="text-contrast font-orienta text-xl">
              Extrato Bancário
            </h2>
          </div>
          <p className="text-xs text-contrast/65 font-inter ml-7 select-text">
            Conta&nbsp;
            <span className="text-contrast font-semibold">{conta}</span>
          </p>
          <div className="mt-2 ml-7">
            <p className="text-xs text-contrast/65 uppercase tracking-wide">
              Saldo atual
            </p>
            <p
              className={`font-inter font-semibold text-lg select-text tabular-nums ${
                saldo >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {fmtBRL(saldo)}
            </p>
          </div>
        </div>

        <div className="h-px bg-secundary/20" />

        {/* Período */}
        <div className="flex flex-col gap-3">
          <span className="text-xs text-contrast/80 font-inter uppercase tracking-wide select-none">
            Período
          </span>

          {/* Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "7 dias", dias: 7 },
              { label: "30 dias", dias: 30 },
              { label: "6 meses", dias: 180 },
              { label: "1 ano", dias: 365 },
            ].map(({ label, dias }) => (
              <button
                key={dias}
                onClick={() => setPreset(dias)}
                className="text-xs font-inter rounded-sm py-2 border
                           border-secundary/40 text-secundary
                           hover:bg-secundary/10 active:scale-95
                           transition-all duration-150 select-none"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Inputs de data personalizados */}
          <div className="flex flex-col gap-2 mt-1">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-contrast/80 select-none">De</span>
              <input
                type="date"
                value={dataInicio}
                max={dataFim}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-black/30 border border-secundaryDark/50 rounded-sm
                           text-contrast text-sm px-3 py-2
                           focus:outline-none focus:border-secundary
                           [color-scheme:dark]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-contrast/80 select-none">Até</span>
              <input
                type="date"
                value={dataFim}
                min={dataInicio}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-black/30 border border-secundaryDark/50 rounded-sm
                           text-contrast text-sm px-3 py-2
                           focus:outline-none focus:border-secundary
                           [color-scheme:dark]"
              />
            </label>
            {dataInvalida && (
              <p className="text-xs text-red-400 font-inter select-text">
                A data inicial não pode ser posterior à data final.
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-secundary/20" />

        {/* Filtro por tipo */}
        <div className="flex flex-col gap-3">
          <span className="text-xs text-contrast/80 font-inter uppercase tracking-wide select-none">
            Tipo de operação
          </span>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`text-xs font-inter rounded-full px-3 py-1.5 border
                            transition-all duration-150 active:scale-95 select-none
                            ${
                              filtroTipo === tipo
                                ? "bg-secundary text-brandDark border-secundary font-semibold"
                                : "border-secundary/40 text-contrast/80 hover:border-secundary/70 hover:text-contrast"
                            }`}
              >
                {TIPO_LABEL[tipo]}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/*  Extrato  */}
      <section className="flex-1 flex flex-col bg-brandDark/60 min-h-screen xl:min-h-0 xl:h-full xl:overflow-y-auto xl:overscroll-none">
        {/* Loading */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 select-none">
            <LoaderCircle size={36} className="text-secundary animate-spin" />
            <p className="text-contrast/100 font-inter text-sm">
              Carregando extrato...
            </p>
          </div>
        )}

        {/* Erro */}
        {!loading && erro && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 select-none">
            <AlertCircle size={36} className="text-red-400 select-none" />
            <p className="text-red-400 font-inter text-sm font-medium">
              {erro.msg}
            </p>
          </div>
        )}

        {/* Data inválida */}
        {!loading && !erro && dataInvalida && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 select-none">
            <Calendar size={36} className="text-contrast/100" />
            <p className="text-contrast/90 font-inter text-sm">
              Corrija o período para visualizar o extrato.
            </p>
          </div>
        )}

        {/* Lista de dias */}
        {!loading && !erro && !dataInvalida && (
          <div className="flex-1 flex flex-col">
            {diasData.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 select-none">
                <Calendar size={36} className="text-contrast/100" />
                <p className="text-contrast/100 font-inter text-sm">
                  Nenhum dado para o período selecionado.
                </p>
              </div>
            )}

            {diasData.map(({ dia, movsExibir, saldoDia, temMovimentos }) => (
              <div key={dia}>
                {/* Cabeçalho do dia */}
                <div
                  className="flex items-center justify-between px-5 py-2
                             bg-brandDark/80
                             border-b border-t border-secundary/10
                             select-none"
                >
                  <span className="text-xs font-inter text-contrast/90 capitalize select-text">
                    {fmtDiaHeader(dia)}
                  </span>
                  <span
                    className={`text-xs font-inter font-semibold tabular-nums select-text ${
                      saldoDia >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {fmtBRL(saldoDia)}
                  </span>
                </div>

                {/* Transações do dia */}
                {movsExibir.length === 0 ? (
                  <div className="px-5 py-3 text-xs text-contrast/80 font-inter italic select-none">
                    {temMovimentos
                      ? "Nenhuma movimentação do tipo selecionado."
                      : "Sem movimentações."}
                  </div>
                ) : (
                  movsExibir.map((mov) => {
                    const entrada = ehEntrada(mov.tipo, mov.destino, conta);
                    const { horario } = formatarData(mov.data);
                    return (
                      <div
                        key={mov.id}
                        className={`flex items-center gap-3 px-5 py-3 select-none
                                    border-b border-white/[0.04]
                                    border-l-4
                                    transition-colors duration-100
                                    ${
                                      entrada
                                        ? "border-l-green-500 bg-green-500/[0.04] hover:bg-green-500/[0.09]"
                                        : "border-l-red-600 bg-red-600/[0.04] hover:bg-red-600/[0.09]"
                                    }`}
                      >
                        {/* Ícone */}
                        <div
                          className={`shrink-0 ${entrada ? "text-green-400" : "text-red-400"}`}
                        >
                          <IconeTipo
                            tipo={mov.tipo}
                            className={
                              entrada ? "text-green-400" : "text-red-400"
                            }
                          />
                        </div>

                        {/* Informações da transação */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-inter font-medium text-contrast">
                              {TIPO_LABEL[mov.tipo] ?? mov.tipo}
                            </span>
                            {mov.tipo === "transferencia" && (
                              <span className="text-xs text-contrast/60 select-text">
                                {entrada
                                  ? `de ${mov.origem}`
                                  : `para ${mov.destino}`}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-contrast/60 select-text">
                            {horario}
                          </span>
                        </div>

                        {/* Valor */}
                        <span
                          className={`text-sm select-text font-inter font-semibold tabular-nums shrink-0 ${
                            entrada ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {entrada ? "+" : "−"}
                          {fmtBRL(mov.valor)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
