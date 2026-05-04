import { useState } from "react";
import { Check, X } from "lucide-react";

// i18n
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../lib/i18n";

export default function CardAprovacao({
  cliente,
  fmtBRL,
  onAprovar,
  onRejeitar,
}) {
  // campo de motivo da rejeição
  const [rejeitando, setRejeitando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [processando, setProcessando] = useState(false);

  const { lang } = useLanguage();

  // Handlers
  const handleAprovar = async () => {
    setProcessando(true);
    await onAprovar(cliente.cpf);
    setProcessando(false);
  };

  const handleConfirmarRejeicao = async () => {
    if (!motivo.trim()) return; // motivo obrigatório
    setProcessando(true);
    await onRejeitar(cliente.cpf, motivo.trim());
    setProcessando(false);
    setRejeitando(false);
    setMotivo("");
  };

  const handleCancelarRejeicao = () => {
    setRejeitando(false);
    setMotivo("");
  };

  // Máscara de CPF para exibição (XXX.XXX.XXX-XX)
  const cpfFormatado = cliente.cpf.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4",
  );

  return (
    <>
      <tr
        className={`transition-colors rounded-md bg-black/20
                    px-2 duration-75 relative
                    h-[5rem] md:h-[4rem] w-full justify-between flex flex-row
          ${processando ? "opacity-50 pointer-events-none" : ""}
          ${rejeitando ? "rounded-b-none " : ""}`}
      >
        <div className="flex flex-col justify-center items-center gap-0 px-2">
          {/* CPF */}
          <div className=" text-contrast font-mono text-xs md:text-sm whitespace-nowrap">
            {cpfFormatado}
          </div>
          {/* Salário */}
          <div className=" text-contrast text-xs md:text-sm whitespace-nowrap select-none">
            {fmtBRL(cliente.salario)}
          </div>
          <div
            className="flex md:hidden
            text-sm text-nowrap font-orienta text-secundary select-none"
          >
            <h1>{cliente.nome}</h1>
          </div>
        </div>

        {/* Nome */}
        <div
          className=" px-3 h-full w-full hidden md:flex text-sm
        text-nowrap overflow-hidden font-orienta items-center justify-center text-contrast select-none"
        >
          <h1>{cliente.nome}</h1>
        </div>

        {/* Ações */}
        <div className="flex items-center pr-4 2xl:pr-2 pl-2 justify-center gap-2 select-none">
          {/* Botão Aprovar */}
          <button
            onClick={handleAprovar}
            disabled={processando || rejeitando}
            title="Aprovar cliente"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs md:text-sm font-semibold
                         bg-green-700/40 text-green-100 border border-green-500/40
                        active:bg-green-800 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed duration-100
                         ${processando || rejeitando ? "" : "hover:bg-green-600/70"}`}
          >
            <Check size={16} />
            <span className="hidden 2xl:inline">
              {t(lang, "ClientesGerenteLista.actions.approve")}
            </span>
          </button>

          {/* Botão Recusar */}
          <button
            onClick={() => setRejeitando(true)}
            disabled={processando || rejeitando}
            title="Recusar cliente"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs md:text-sm font-semibold
                         bg-transparent text-red-100 border border-red-500/40
                         active:bg-red-800 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed duration-100
                         ${processando || rejeitando ? "" : "hover:bg-red-600/40"}`}
          >
            <X size={16} />
            <span className="hidden 2xl:inline">
              {t(lang, "ClientesGerenteLista.actions.reject")}
            </span>
          </button>
        </div>
        {/* Linha expandida */}
        {rejeitando && (
          <tr
            className="bg-black/20 rounded-b-md absolute left-0 top-full w-full px-3 py-3
          flex flex-col md:justify-between sm:flex-row items-stretch sm:items-center gap-2 select-none"
          >
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t(lang, "ClientesGerenteLista.rejection_reason")}
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-brandDark/80 border border-secundaryDark/40
                           text-contrast placeholder-contrastDark font-inter text-sm
                           focus:outline-none focus:border-secundary/60"
            />

            {/* Confirmar rejeição */}
            <div className="w-full md:w-fit h-full flex md:flex-row flex-col gap-2">
              <button
                onClick={handleConfirmarRejeicao}
                disabled={!motivo.trim() || processando}
                className={`px-4 py-2 rounded-sm text-sm font-semibold
                           bg-red-700/80 text-red-100 border border-red-500/40
                            transition-colors duration-100
                           disabled:opacity-40 disabled:cursor-not-allowed
                           ${!motivo.trim() ? "" : "hover:bg-red-600/80"}`}
              >
                {t(lang, "ClientesGerenteLista.actions.confirm")}
              </button>

              {/* Cancelar */}
              <button
                onClick={handleCancelarRejeicao}
                className="px-4 py-2 rounded-sm text-sm font-semibold duration-100
                           bg-neutral-700/60 text-neutral-200 border border-neutral-500/30
                           hover:bg-neutral-600/60 transition-colors"
              >
                {t(lang, "ClientesGerenteLista.actions.cancel")}
              </button>
            </div>
          </tr>
        )}
      </tr>

      {rejeitando && (
        <tr className="bg-transparent h-[9rem] md:h-[3.5rem] w-full"></tr>
      )}
    </>
  );
}
