import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import ScrollOperation from "./ScrollOperation";

export default function ScrollBox({ title, isOpen, onToggle, setIsAnimating }) {
  const lidRef = useRef(null);
  const boxRef = useRef(null);
  const scrollRef = useRef(null);
  const isFirstRender = useRef(true);
  const tlRef = useRef(null);

  const [isAtCenter, setIsAtCenter] = useState(false);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    valor: "",
    conta: "",
  });

  const flow = {
    Depósito: ["valor", "confirmar", "resultado"],
    Saque: ["valor", "confirmar", "resultado"],
    Transferência: ["conta", "valor", "confirmar", "resultado"],
  };

  const currentFlow = flow[title] || [];
  const visibleSteps = currentFlow.slice(0, step);

  const handleNext = () => {
    const currentStepType = currentFlow[step - 1];

    if (currentStepType === "valor" && !form.valor) return;
    if (currentStepType === "conta" && !form.conta) return;

    setStep(step + 1);
  };

  const moveToCenter = () => {
    const rect = scrollRef.current.getBoundingClientRect();

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const elementCenterX = rect.left + rect.width / 2;
    const elementTopY = rect.top;

    return {
      x: centerX - elementCenterX,
      y: centerY - elementTopY - 120,
    };
  };

  const openAnimation = () => {
    // 🔥 mata animação anterior
    if (tlRef.current) {
      tlRef.current.kill();
    }

    setIsAtCenter(false);

    const { x, y } = moveToCenter();

    const tl = gsap.timeline({
      onStart: () => {
        gsap.set(scrollRef.current, { zIndex: 5 });
      },
      onComplete: () => {
        gsap.set(scrollRef.current, { zIndex: 20 });
        setIsAtCenter(true);
        setStep(1);
      },
    });

    tlRef.current = tl; // 🔥 salva referência

    gsap.set(scrollRef.current, {
      transformOrigin: "top center",
    });

    tl.to(boxRef.current, { scale: 1.02, duration: 0.2 })
      .to(lidRef.current, {
        y: -35,
        rotateX: 35,
        rotateZ: 3,
        scale: 1.05,
        duration: 0.3,
      })
      .to(lidRef.current, { x: 200, duration: 0.5 })
      .to(scrollRef.current, {
        y: -25,
        scale: 1.05,
        duration: 0.3,
      })
      .to(scrollRef.current, {
        x,
        y,
        scale: 1.6,
        duration: 0.8,
        ease: "power3.out",
      });
  };

  const closeAnimation = () => {
    // 🔥 mata animação anterior
    if (tlRef.current) {
      tlRef.current.kill();
    }

    setIsAtCenter(false);

    const tl = gsap.timeline({
      onComplete: () => {
        setStep(0);
        setForm({ valor: "", conta: "" });
      },
    });

    tlRef.current = tl; // 🔥 salva referência

    tl.to(scrollRef.current, { zIndex: 5 })
      .to(scrollRef.current, { scale: 1, duration: 0.3 })
      .to(scrollRef.current, { x: 0, y: 0, duration: 0.5 })
      .to(lidRef.current, { x: 0, duration: 0.4 })
      .to(lidRef.current, {
        y: 0,
        rotateX: 10,
        rotateZ: 0,
        duration: 0.4,
      });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isOpen) openAnimation();
    else closeAnimation();
  }, [isOpen]);
  return (
    <div className="flex justify-center items-center perspective-[1000px]">
      <div
        ref={boxRef}
        className="relative min-w-80 h-32 cursor-pointer"
        onClick={!isOpen ? onToggle : undefined}
      >
        {/* BASE */}
        <div className="absolute inset-0 bg-red-800 rounded-xl border border-red-900 shadow-inner" />

        {/* PERGAMINHO */}
        <div
          ref={scrollRef}
          className="absolute left-1/2 top-1/2"
          style={{
            transform: "translate(-50%, -60%)",
          }}
        >
          <ScrollOperation isActive={isAtCenter}>
            <h1 className="text-center font-semibold">{title}</h1>

            {visibleSteps.includes("conta") && (
              <input
                type="text"
                placeholder="Conta destino"
                className="w-full border p-1"
                value={form.conta}
                onChange={(e) => setForm({ ...form, conta: e.target.value })}
                onBlur={handleNext}
              />
            )}

            {visibleSteps.includes("valor") && (
              <input
                type="number"
                placeholder="Valor"
                className="w-full border p-1"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                onBlur={handleNext}
              />
            )}

            {visibleSteps.includes("confirmar") && (
              <div className="flex gap-2 justify-center">
                <button
                  className="text-green-600"
                  onClick={() => setStep(step + 1)}
                >
                  Confirmar
                </button>
                <button className="text-gray-500" onClick={onToggle}>
                  Cancelar
                </button>
              </div>
            )}

            {visibleSteps.includes("resultado") && (
              <div className="text-sm text-center">
                <p>Operação: {title}</p>
                {title === "Transferência" && <p>Conta: {form.conta}</p>}
                <p>Valor: {form.valor}</p>

                <button
                  className="mt-2 bg-red-600 text-white px-2 py-1"
                  onClick={onToggle}
                >
                  Fechar
                </button>
              </div>
            )}
          </ScrollOperation>
        </div>

        {/* TAMPA */}
        <div
          ref={lidRef}
          className="absolute inset-0 flex items-center justify-center bg-red-600 rounded-xl text-secundary font-long-cang text-3xl z-10"
        >
          {title}
        </div>
      </div>
    </div>
  );
}
