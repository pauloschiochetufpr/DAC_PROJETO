import { useState } from "react";
import ScrollBox from "../components/Operations/ScrollBox";
import { Link } from "react-router-dom";

export default function OperationsCli() {
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
      <div className="absolute top-6 left-6 z-[200]">
        <Link to="/">
          <div className="relative w-32 h-10 rounded-xl overflow-hidden cursor-pointer group">
            {/* SOMBRA SUPERIOR */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#00000090,#00000040_40%,transparent_80%)]" />

            {/* VOLUME */}
            <div className="absolute inset-0 bg-[linear-gradient(to_top,#00000040,transparent_50%,#ffffff05)]" />

            {/* REFLEXO LATERAL */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08),transparent_30%,transparent_70%,rgba(255,255,255,0.08))]" />

            {/* BORDA BRILHO HOVER */}
            <div className="absolute inset-0 border border-transparent group-hover:border-orange-300/40 group-hover:shadow-[0_0_10px_rgba(255,120,80,0.25)] transition-all duration-300 rounded-xl" />

            {/* TEXTO */}
            <div className="relative z-10 flex items-center justify-center h-full text-sm text-secundary group-hover:text-orange-300 transition">
              <span className="mr-2 group-hover:-translate-x-1 transition">
                ←
              </span>
              Voltar
            </div>
          </div>
        </Link>
      </div>
      <ScrollBox
        title="Saque"
        isOpen={openBox === "saque"}
        onToggle={() => handleToggle("saque")}
        setIsAnimating={setIsAnimating}
      />

      <ScrollBox
        title="Depósito"
        isOpen={openBox === "deposito"}
        onToggle={() => handleToggle("deposito")}
        setIsAnimating={setIsAnimating}
      />

      <ScrollBox
        title="Transferência"
        isOpen={openBox === "transferencia"}
        onToggle={() => handleToggle("transferencia")}
        setIsAnimating={setIsAnimating}
      />
    </div>
  );
}
