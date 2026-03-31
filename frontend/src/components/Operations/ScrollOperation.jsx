import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export default function ScrollOperation({ isActive, children }) {
  const contentRef = useRef(null);
  const wrapperRef = useRef(null);
  const bottomRollRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const content = contentRef.current;
    const fullHeight = content.scrollHeight;

    gsap.to(content, {
      height: fullHeight,
      duration: 0.3,
      ease: "power2.out",
    });

    gsap.to(bottomRollRef.current, {
      top: 24 + fullHeight, // 🔥 usa TOP em vez de Y
      duration: 0.3,
      ease: "power2.out",
    });
  }, [children, isActive]);

  useEffect(() => {
    if (isActive) open();
    else close();
  }, [isActive]);

  const open = () => {
    const content = contentRef.current;
    const fullHeight = content.scrollHeight;

    gsap.set(content, { height: 0 });

    const tl = gsap.timeline();

    tl.to(content, {
      height: fullHeight,
      duration: 0.5,
      ease: "power2.out",
    }).to(
      bottomRollRef.current,
      {
        top: 24 + fullHeight, // 🔥 FIX REAL
        duration: 0.5,
        ease: "power2.out",
      },
      "<",
    );
  };

  const close = () => {
    const tl = gsap.timeline();

    tl.to(contentRef.current, {
      height: 0,
      duration: 0.4,
      ease: "power2.in",
    }).to(
      bottomRollRef.current,
      {
        top: 24,
        duration: 0.4,
        ease: "power2.in",
      },
      "<",
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-44 scale-90">
      {/* 🔥 Rolo superior */}
      <div className="bg-yellow-700 h-6 w-[120%] rounded-full absolute top-0 left-1/2 -translate-x-1/2 z-10 shadow-md" />

      {/* 🔥 CONTEÚDO */}
      <div
        ref={contentRef}
        className="absolute top-6 left-1/2 -translate-x-1/2 w-full bg-yellow-200 border border-yellow-600 shadow-inner overflow-hidden"
        style={{ height: 0 }}
      >
        <div className="p-2 flex flex-col gap-2 text-black text-sm">
          {children}
        </div>
      </div>

      {/* 🔥 Rolo inferior */}
      <div
        ref={bottomRollRef}
        className="bg-yellow-700 h-6 w-[120%] rounded-full absolute left-1/2 -translate-x-1/2 shadow-md"
        style={{
          top: 24, // começa logo abaixo do topo
        }}
      />
    </div>
  );
}
