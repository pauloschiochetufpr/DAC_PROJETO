import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export default function ScrollOperation({
  isActive,
  children,
  isOpen,
  onCloseComplete,
}) {
  const contentRef = useRef(null);
  const topRollRef = useRef(null);
  const bottomRollRef = useRef(null);

  useEffect(() => {
    const content = contentRef.current;
    const bottom = bottomRollRef.current;

    if (!content || !bottom) return;

    const fullHeight = content.scrollHeight;

    const tl = gsap.timeline();

    if (isActive) {
      tl.to(content, {
        height: fullHeight,
        duration: 1,
        ease: "power2.out",
      }).to(
        bottom,
        {
          top: fullHeight + 40,
          duration: 1,
          ease: "power2.out",
        },
        0, // sincroniza com início
      );
    } else {
      tl.to(content, {
        height: 0,
        duration: 1,
        ease: "power2.inOut",
      }).to(
        bottom,
        {
          top: 40,
          duration: 1,
          ease: "power2.inOut",
        },
        0,
      );
      if (!isOpen) {
        tl.add(() => {
          onCloseComplete?.();
        });
      }
    }
  }, [isActive, isOpen, children]);

  return (
    <div className="relative w-60 scale-95">
      {/* TOPO */}
      <div
        ref={topRollRef}
        className="bg-brand h-[3rem] w-[120%] absolute -top-2 left-1/2 -translate-x-1/2 rounded-full overflow-hidden z-10 shadow-md"
        style={{ transformOrigin: "center center" }}
      >
        <div className="parchment-roll-edge parchment-roll-edge-left"></div>
        <div className="parchment-roll-edge parchment-roll-edge-right"></div>
        <div className="w-[25%] h-full right-0 top-0 absolute bg-gradient-to-r from-transparent to-brandDark/60"></div>
        <div className="w-[25%] h-full left-0 top-0 absolute bg-gradient-to-l from-transparent to-brandDark/60"></div>
        <div className="w-full h-[60%] left-0 bottom-0 absolute bg-gradient-to-b from-transparent to-brandDark/60"></div>
      </div>

      {/* CONTEÚDO */}
      <div
        ref={contentRef}
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[90%] overflow-hidden border-x-[2px] border-secundaryDark bg-brand"
        style={{ height: 0 }}
      >
        {/* textura / sombras */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-[30%] h-full right-0 absolute bg-gradient-to-r from-transparent to-brandDark/50"></div>
          <div className="w-[30%] h-full left-0 absolute bg-gradient-to-l from-transparent to-brandDark/50"></div>
          <div className="w-full h-[50%] top-0 absolute bg-gradient-to-t from-transparent to-brandDark/70"></div>
          <div className="w-full h-[50%] bottom-0 absolute bg-gradient-to-b from-transparent to-brandDark/50"></div>
        </div>

        <div className="relative z-10 flex flex-col text-sm text-black">
          {children}
        </div>
      </div>

      {/* BASE */}
      <div
        ref={bottomRollRef}
        className="bg-brand h-[3rem] w-[120%] absolute left-1/2 -translate-x-1/2 rounded-full overflow-hidden shadow-md"
        style={{ top: 40, transformOrigin: "center center" }}
      >
        <div className="parchment-roll-edge parchment-roll-edge-left"></div>
        <div className="parchment-roll-edge parchment-roll-edge-right"></div>
        <div className="w-[25%] h-full right-0 top-0 absolute bg-gradient-to-r from-transparent to-brandDark/60"></div>
        <div className="w-[25%] h-full left-0 top-0 absolute bg-gradient-to-l from-transparent to-brandDark/60"></div>
        <div className="w-full h-[60%] left-0 bottom-0 absolute bg-gradient-to-b from-transparent to-brandDark/60"></div>
      </div>
    </div>
  );
}
