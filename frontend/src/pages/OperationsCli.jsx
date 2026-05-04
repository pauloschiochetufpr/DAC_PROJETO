import { useState } from "react";
import ScrollBox from "../components/Operations/ScrollBox";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

//i18n
import { t } from "../lib/i18n";
import { useLanguage } from "../hooks/useLanguage";

export default function OperationsCli() {
  const { lang } = useLanguage();
  const [openBox, setOpenBox] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (box) => {
    if (openBox === box) {
      setOpenBox(null);
    } else if (openBox === null) {
      setOpenBox(box);
    }
  };

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
        isOpen={openBox === "saque"}
        onToggle={() => handleToggle("saque")}
        setIsAnimating={setIsAnimating}
      />

      <ScrollBox
        title={t(lang, "Types.deposito")}
        flowType="Depósito"
        isOpen={openBox === "deposito"}
        onToggle={() => handleToggle("deposito")}
        setIsAnimating={setIsAnimating}
      />

      <ScrollBox
        title={t(lang, "Types.transferencia")}
        flowType="Transferência"
        isOpen={openBox === "transferencia"}
        onToggle={() => handleToggle("transferencia")}
        setIsAnimating={setIsAnimating}
      />
    </div>
  );
}
