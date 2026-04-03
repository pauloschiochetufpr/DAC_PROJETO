import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import waves from "../../assets/pattern/NotDone/waves.svg";
import ScrollOperation from "./ScrollOperation";

export default function ScrollBox({ title, isOpen, onToggle }) {
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

  // 💰 FORMATADOR
  const formatCurrency = (value) => {
    const number = Number(value) / 100;

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleValorChange = (e) => {
    let raw = e.target.value.replace(/\D/g, ""); // só números

    if (!raw) {
      setForm({ ...form, valor: "" });
      return;
    }

    setForm({
      ...form,
      valor: formatCurrency(raw),
    });
  };

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
    if (tlRef.current) tlRef.current.kill();

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

    tlRef.current = tl;

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
    if (tlRef.current) tlRef.current.kill();

    setIsAtCenter(false);

    const tl = gsap.timeline();

    tlRef.current = tl;

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
        className="relative min-w-80 h-32 cursor-pointer select-none"
        onClick={!isOpen ? onToggle : undefined}
      >
        {/* BASE 3D */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          {/* COR BASE */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-800 to-red-950" />

          {/* LUZ (top-left) */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

          {/* SOMBRA INTERNA */}
          <div className="absolute inset-0 shadow-[inset_0_6px_12px_rgba(0,0,0,0.6)] pointer-events-none" />

          {/* BORDA INTERNA (profundidade) */}
          <div className="absolute inset-0 rounded-xl border border-red-950/80 pointer-events-none" />

          {/* FUNDO DA CAIXA (efeito 3D) */}
          <div className="absolute inset-2 rounded-lg bg-gradient-to-b from-red-900 to-black/30 shadow-inner" />

          {/* SOMBRA GLOBAL (flutuando) */}
          <div className="absolute inset-0 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] pointer-events-none" />
        </div>

        {/* PERGAMINHO */}
        <div
          ref={scrollRef}
          className="absolute left-1/2 top-[22%]"
          style={{
            transform: "translate(-50%, -60%)",
          }}
        >
          <ScrollOperation
            isActive={isAtCenter}
            isOpen={isOpen}
            onCloseComplete={() => {
              setStep(0);
              setForm({ valor: "", conta: "" });
            }}
          >
            <div className="flex flex-col h-full">
              {/* BOTÃO FIXO */}
              <div className="py-1 flex justify-center">
                <button
                  className="text-secundaryDark font-semibold hover:text-secundary transition-colors select-none"
                  onClick={onToggle}
                >
                  Cancelar
                </button>
              </div>

              {/* CONTEÚDO */}
              <div className="flex-1 w-full relative border-t border-secundary">
                <div className="relative z-10 mx-3 p-2 flex flex-col gap-2 overflow-y-auto border-x border-secundary">
                  <h1 className="text-center font-orienta text-secundary font-semibold select-none">
                    {title}
                  </h1>

                  {/* CONTA */}
                  {visibleSteps.includes("conta") && (
                    <div className="flex flex-col">
                      <label className="text-xs text-secundaryDark select-none">
                        Conta Destino
                      </label>
                      <input
                        type="text"
                        className="w-full border text-xs border-secundary bg-contrastDark/25 text-secundary rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-secundary"
                        value={form.conta}
                        onChange={(e) =>
                          setForm({ ...form, conta: e.target.value })
                        }
                        onBlur={handleNext}
                      />
                    </div>
                  )}

                  {/* VALOR */}
                  {visibleSteps.includes("valor") && (
                    <div className="flex flex-col">
                      <label className="text-xs text-secundaryDark select-none">
                        Valor
                      </label>
                      <input
                        type="text"
                        placeholder="R$ 00,00"
                        inputMode="numeric"
                        className="w-full border text-xs border-secundary bg-contrastDark/25 text-secundary rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-secundary"
                        value={form.valor}
                        onChange={handleValorChange}
                        onBlur={handleNext}
                      />
                    </div>
                  )}

                  {/* CONFIRMAR */}
                  {visibleSteps.includes("confirmar") && (
                    <button
                      className="text-green-600 rounded hover:text-green-500 select-none"
                      onClick={() => setStep(step + 1)}
                    >
                      Confirmar
                    </button>
                  )}

                  {/* RESULTADO */}
                  {visibleSteps.includes("resultado") && (
                    <div className="text-sm text-center bg-contrastDark/25 text-secundary p-1 rounded">
                      <p className="select-none">Operação: {title}</p>
                      {title === "Transferência" && (
                        <p className="select-none">Conta: {form.conta}</p>
                      )}
                      <p className="select-none">Valor: {form.valor}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* FECHAR */}
              {visibleSteps.includes("resultado") && (
                <div className="border-t py-1 border-secundary flex justify-center">
                  <button
                    className="text-secundaryDark text-sm font-semibold hover:text-secundary transition-colors select-none"
                    onClick={onToggle}
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </ScrollOperation>
        </div>

        {/* TAMPA */}
        <div
          ref={lidRef}
          className="absolute inset-0 flex items-center justify-center rounded-xl text-secundary font-long-cang text-3xl z-10 select-none overflow-hidden"
        >
          {/* BASE */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-900" />
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: `url(${waves})`,
            }}
          />
          {/* LUZ */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />

          {/* SOMBRA */}
          <div className="absolute inset-0 shadow-[inset_0_-6px_12px_rgba(0,0,0,0.7)]" />

          {/* BORDA */}
          <div className="absolute inset-0 rounded-xl border border-red-950/80" />

          {/* TEXTO */}
          <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
}
