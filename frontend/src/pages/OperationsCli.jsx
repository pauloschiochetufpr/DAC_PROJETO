import { useEffect, useState } from "react";
import ScrollBox from "../components/Operations/ScrollBox";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { ClienteService } from "../services/ClienteService";

//i18n
import { t } from "../lib/i18n";
import { useLanguage } from "../hooks/useLanguage";

export default function OperationsCli() {
  const { lang } = useLanguage();

  const { usuario } = useAuth();

  const [openBox, setOpenBox] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const [cliente, setCliente] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(true);
  const [erroCliente, setErroCliente] = useState(null);

  useEffect(() => {
    async function carregarCliente() {
      if (!usuario?.cpf) {
        setErroCliente("Não foi possível identificar o cliente autenticado.");
        setLoadingCliente(false);
        return;
      }

      try {
        setLoadingCliente(true);
        setErroCliente(null);

        const data = await ClienteService.buscarPorCpf(usuario.cpf);
        setCliente(data);
      } catch (err) {
        console.error("Erro ao carregar cliente:", err);
        setErroCliente(err.message || "Erro ao carregar dados do cliente.");
      } finally {
        setLoadingCliente(false);
      }
    }

    carregarCliente();
  }, [usuario?.cpf]);

  const contaOrigem = cliente?.conta ?? "";

  const handleToggle = (box) => {
    if (openBox === box) {
      setOpenBox(null);
    } else if (openBox === null) {
      setOpenBox(box);
    }
  };

  if (loadingCliente) {
    return (
      <div className="mt-56 text-center text-secundary">
        Carregando dados da conta...
      </div>
    );
  }

  if (erroCliente) {
    return <div className="mt-56 text-center text-red-400">{erroCliente}</div>;
  }

  if (!contaOrigem) {
    return (
      <div className="mt-56 text-center text-red-400">
        Conta do cliente não encontrada.
      </div>
    );
  }

  return (
    <div className="flex mt-56 justify-around items-start relative">
      <div className="fixed top-52 left-6 z-[50]">
        <Link to="/">
          <button
            className="
        group flex items-center gap-2
        text-secundary text-3xl md:text-4xl
        transition-all duration-200
        hover:text-orange-300 font-long-cang
      "
          >
            <ArrowLeft
              className="
          w-5 h-5 md:w-6 md:h-6 
          transition-transform duration-200
          group-hover:-translate-x-1
        "
            />
            <span>{t(lang, "Profile.actions.back")}</span>
          </button>
        </Link>
      </div>
      <ScrollBox
        title={t(lang, "Types.saque")}
        flowType="Saque"
        contaOrigem={contaOrigem}
        isOpen={openBox === "saque"}
        onToggle={() => handleToggle("saque")}
        setIsAnimating={setIsAnimating}
      />

      <ScrollBox
        title={t(lang, "Types.deposito")}
        flowType="Depósito"
        contaOrigem={contaOrigem}
        isOpen={openBox === "deposito"}
        onToggle={() => handleToggle("deposito")}
        setIsAnimating={setIsAnimating}
      />

      <ScrollBox
        title={t(lang, "Types.transferencia")}
        flowType="Transferência"
        contaOrigem={contaOrigem}
        isOpen={openBox === "transferencia"}
        onToggle={() => handleToggle("transferencia")}
        setIsAnimating={setIsAnimating}
      />
    </div>
  );
}
