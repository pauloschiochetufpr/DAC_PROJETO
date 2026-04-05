import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";

// gsap
import { gsap } from "gsap";

//SVG's
import SecundaryBorder from "../../assets/icons/SecundaryDarkBorder.svg";

export default function BotaoPergaminho({ text, icon: Icon, ref }) {
  // Ref's para animação do pergaminho
  const buttonRef = useRef(null);
  const pergaminhoRef = useRef(null);
  const rolo1Ref = useRef(null);
  const rolo2Ref = useRef(null);
  const papelRef = useRef(null);

  // Animação Gsap | Pergaminho
  useEffect(() => {
    const button = buttonRef.current;
    const rollHeight = rolo1Ref.current.offsetHeight;
    const buttonHeight = button.offsetHeight;
    // Distância que o Rolo 2 precisa descer e o papel precisa crescer
    const travel = buttonHeight - rollHeight * 2;

    // Estado inicial | container com os dois rolos em fluxo (tocando-se), papel invisível
    gsap.set(pergaminhoRef.current, { height: rollHeight * 2 });
    gsap.set(papelRef.current, { top: rollHeight, height: 0 });

    const tl = gsap.timeline({ paused: true, delay: 0.5 });

    // Container cresce para cima
    // Ações passoa a passo:
    // Rolo 1 sobe automaticamente (está no topo do fluxo)
    // Rolo 2 desce via translateY para permanecer na base
    // Papel cresce para cobrir o espaço entre os dois rolos
    tl.to(
      pergaminhoRef.current,
      { height: buttonHeight, duration: 0.85, ease: "power2.out" },
      0,
    )
      .to(
        rolo2Ref.current,
        { y: travel, duration: 0.85, ease: "power2.out" },
        0,
      )
      .to(
        papelRef.current,
        { height: travel, duration: 0.85, ease: "power2.out" },
        0,
      );

    const handleOpen = () => tl.timeScale(1).play();
    const handleClose = () => tl.timeScale(2.8).reverse();

    button.addEventListener("mouseenter", handleOpen);
    button.addEventListener("mouseleave", handleClose);

    return () => {
      button.removeEventListener("mouseenter", handleOpen);
      button.removeEventListener("mouseleave", handleClose);
      tl.kill();
    };
  }, []);

  return (
    <div
      className="w-full h-full flex flex-col relative group
                "
    >
      <div
        className="absolute h-full w-[80%] left-1/2 -translate-x-1/2
                    group-hover:shadow-xl group-hover:shadow-white/15 group-hover:bg-white/15
                    duration-200 ease-out transition-all
                    border-secundaryDark/40 border-[0.1px] rounded-sm pointer-events-none"
      ></div>
      <Link
        to={ref}
        ref={buttonRef}
        className="w-full h-full flex flex-col justify-start items-center text-center
            text-md font-semibold font-istok-web
              relative overflow-visible select-none"
      >
        <h1 className="pt-[3rem]">{text}</h1>
        {/* Pergaminho inicio */}
        <div
          ref={pergaminhoRef}
          className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none z-10"
        >
          {/* Rolo 1 - em fluxo normal; sobe automaticamente com o container */}
          <div
            ref={rolo1Ref}
            className="w-full h-8 overflow-hidden
                    bg-brand relative
                    rounded-l-[20px] rounded-r-[20px]
                    border-b-brandDark border-b-[0.1px]
                    flex flex-row justify-between z-[1]"
          >
            {/* textura */}
            <div className="absolute top-0 left-0 h-full w-full z-[2]">
              <div
                className="bg-gradient-to-b from-white/10 to-transparent
                absolute bottom-0
                w-full h-[100%]"
              ></div>
              <div
                className="bg-gradient-to-t from-black/50 to-transparent
                absolute bottom-0
                w-full h-[40%]"
              ></div>
              <div
                className="bg-gradient-to-tr from-black/20 to-transparent
                absolute bottom-0
                w-full h-[100%]"
              ></div>
              <div
                className="bg-gradient-to-tl from-black/20  to-transparent
                absolute bottom-0
                w-full h-[100%]"
              ></div>
            </div>
            <div className="bg-secundary w-[20%] h-full parchment-roll-edge-neutral-left z-[1]"></div>
            <div className="bg-secundary w-[20%] h-full parchment-roll-edge-neutral-right z-[1]"></div>
          </div>
          {/* Papel central do pergaminho */}
          <div
            ref={papelRef}
            className="absolute left-1/2 -translate-x-1/2 w-[80%] bg-brand flex justify-center items-center z-[0]"
            style={{ top: 0, height: 0 }}
          >
            {/* textura */}
            <div className="absolute top-0 left-0 h-full w-full z-[2]">
              <div
                className="bg-gradient-to-b from-black/40 to-transparent
                absolute top-0
                w-full h-[40%]"
              ></div>
              <div
                className="bg-gradient-to-t from-black/40 to-transparent
                absolute bottom-0
                w-full h-[40%]"
              ></div>
              <div
                className="bg-gradient-to-tr from-black/20 to-transparent
                absolute bottom-0
                w-full h-[100%]"
              ></div>
              <div
                className="bg-gradient-to-tl from-black/20  to-transparent
                absolute bottom-0
                w-full h-[100%]"
              ></div>
              <div
                className="absolute w-[4rem] h-[5rem] top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 rounded-full
                            bg-white/15 shadow-[0_0px_35px_3px_rgba(255,255,255,0.34)]"
              ></div>
            </div>
            <div className="h-full w-[70%] flex flex-col justify-center items-center bg-amber-100 overflow-hidden">
              <div className="h-[4rem] w-[4rem]">
                {Icon && <Icon className="h-full w-full text-black/60" />}
              </div>
            </div>
          </div>
          {/* Rolo 2 - em fluxo normal; desliza para baixo via GSAP */}
          <div
            ref={rolo2Ref}
            className="w-full h-8 overflow-hidden
                    bg-brand
                    rounded-l-[20px] rounded-r-[20px]
                    flex flex-row justify-between z-[1]"
          >
            {/* textura */}
            <div className="absolute top-0 left-0 h-full w-full z-[2]">
              <div
                className="bg-gradient-to-b from-white/10 to-transparent
                absolute bottom-0
                w-full h-[100%]"
              ></div>
              <div
                className="bg-gradient-to-t from-black/50 to-transparent
                absolute bottom-0
                w-full h-[40%]"
              ></div>
              <div
                className="bg-gradient-to-tr from-black/20 to-transparent
                absolute bottom-0
                w-full h-[100%]"
              ></div>
              <div
                className="bg-gradient-to-tl from-black/20  to-transparent
                absolute bottom-0
                w-full h-[100%]"
              ></div>
            </div>
            <div className="bg-secundary w-[20%] h-full parchment-roll-edge-neutral-left z-[1]"></div>
            <div className="bg-secundary w-[20%] h-full parchment-roll-edge-neutral-right z-[1]"></div>
          </div>
        </div>
        {/* Pergaminho fim */}
      </Link>
    </div>
  );
}
