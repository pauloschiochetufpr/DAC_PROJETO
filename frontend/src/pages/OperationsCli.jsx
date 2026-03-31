import { useState } from "react";
import ScrollBox from "../components/Operations/ScrollBox";

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
