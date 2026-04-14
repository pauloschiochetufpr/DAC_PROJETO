import { useState, useRef, useEffect } from "react";

// Lucide icon's
import {
  Languages,
  ChevronDown,
  ChevronUp,
  SquareArrowOutUpRight,
  ExternalLink,
} from "lucide-react";

// i18n
import { t } from "../lib/i18n";
import { useLanguage } from "../hooks/useLanguage";

const languages = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
];

export default function Footer() {
  // States de idioma + dropdown
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useLanguage();
  const selected = languages.find((l) => l.value === lang) ?? languages[0];
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      const inDesktop =
        desktopRef.current && desktopRef.current.contains(e.target);
      const inMobile =
        mobileRef.current && mobileRef.current.contains(e.target);
      if (!inDesktop && !inMobile) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <footer
      className="h-fit pb-8 pt-8 px-4 flex flex-col items-center justify-center text-sm
                      bg-gradient-to-t from-black/30 to-transparent"
    >
      <div className="flex flex-col xl:flex-row w-full h-fit">
        {/* Coluna de informações */}
        {/* Primeira coluna footer */}
        <div
          className="h-fit w-full flex flex-col items-center xl:items-start justify-start
                        xl:px-32 px-2 xl:pb-24 xl:pt-16 py-6 select-none gap-4"
        >
          <button
            className="flex flex-row font-istok-web font-semibold text-base gap-1 w-full items-center justify-center
            hover:underline"
          >
            {t(lang, "Footer.supported_ongs")}
            <SquareArrowOutUpRight size={12} />
          </button>
          <button
            className="flex flex-row font-istok-web font-semibold text-base gap-1 w-full items-center justify-center
            hover:underline"
          >
            {t(lang, "Footer.privacy_policy")}{" "}
            <SquareArrowOutUpRight size={12} />
          </button>
        </div>

        {/* Segunda coluna footer */}
        <div className="h-fit w-full flex flex-col items-center xl:items-start justify-start px-1 xl:px-32 py-6 select-none xl:gap-6 gap-8">
          <h1 className="font-long-cang xl:text-4xl text-3xl text-secundary xl:pb-4 pb-6 text-nowrap w-full text-center">
            Conheça nossas redes!
          </h1>
          <div className="flex flex-col xl:gap-6 gap-8 justify-center items-center w-full">
            <button
              className="flex flex-row font-istok-web font-semibold gap-1 pl-4 xl:pb-0 pb-10 xl:text-base text-lg
            hover:underline"
            >
              Instagram <ExternalLink size={12} />
            </button>
            <button
              className="flex flex-row font-istok-web font-semibold gap-1 pl-4 xl:pb-0 pb-10 xl:text-base text-lg
            hover:underline"
            >
              LinkedIn <ExternalLink size={12} />
            </button>
            <button
              className="flex flex-row font-istok-web font-semibold gap-1 pl-4 xl:pb-0 pb-10 xl:text-base text-lg
            hover:underline"
            >
              X (Twitter) <ExternalLink size={12} />
            </button>
            <button
              className="flex flex-row font-istok-web font-semibold gap-1 pl-4 xl:pb-0 pb-10 xl:text-base text-lg
            hover:underline"
            >
              YouTube <ExternalLink size={12} />
            </button>
            <button
              className="flex flex-row font-istok-web font-semibold gap-1 pl-4 xl:pb-0 pb-10 xl:text-base text-lg
            hover:underline"
            >
              Facebook <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* Ultima coluna footer */}
        <div
          className="h-fit w-full relative flex items-center xl:items-start justify-start
        px-10 xl:px-32 py-6 select-none"
        >
          {/* Botão de languages desktop */}
          <div
            ref={desktopRef}
            className="xl:block hidden relative w-full h-fit"
          >
            <div className="w-fith-fit opacity-0 bg-transparent text-lg font-bold font-istok-web py-4 pt-3">
              {" "}
              English
            </div>
            {/* Botão trigger */}
            <button
              onClick={() => setOpen((v) => !v)}
              className={`
                right-0 top-0 absolute
                w-fit h-fit min-w-[12rem]
                rounded-sm px-4 py-2 pt-3
                text-lg font-bold font-istok-web
                cursor-pointer outline-none select-none
                transition-all duration-300 ease-in-out border border-lightDark
                flex flex-row items-start gap-2 justify-between
                ${open ? "bg-lightDark shadow-md shadow-black/40" : "bg-lightDark/30"}
              `}
            >
              <h1 className="flex flex-row gap-3">
                <Languages size={24} />
                {selected.label}{" "}
              </h1>
              <span className="text-sm">
                {open ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </span>
            </button>

            {/* Lista de opções */}
            <ul
              className={`
                absolute top-full right-0
                bg-lightDark
                rounded-sm overflow-hidden
                min-w-[12rem] z-50
                shadow-lg
                transition-opacity duration-200 ease-in-out
                ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
              `}
            >
              {languages.map((lang) => (
                <li
                  key={lang.value}
                  onClick={() => {
                    setLang(lang.value);
                    setOpen(false);
                  }}
                  className={`
                    px-6 py-2
                    font-bold font-istok-web text-lg
                    cursor-pointer select-none
                    transition-colors duration-150
                    hover:bg-brand/70 hover:text-white
                    ${selected.value === lang.value ? "bg-lightDark/50" : ""}
                  `}
                >
                  {lang.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FIM Coluna de informações */}
      </div>

      {/* Botão de languages celular */}
      <div
        ref={mobileRef}
        className="xl:hidden flex items-center justify-center relative w-full h-fit py-4"
      >
        {/* Botão trigger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`
                w-fit h-fit min-w-[12rem]
                rounded-sm px-4 py-2 pt-3
                text-lg font-bold font-istok-web
                cursor-pointer outline-none select-none
                transition-all duration-300 ease-in-out
                flex flex-row items-start gap-2 justify-between border border-lightDark
                ${open ? "bg-lightDark shadow-md shadow-black/40" : "bg-lightDark/30"}
              `}
        >
          <h1 className="flex flex-row gap-3">
            <Languages size={24} />
            {selected.label}{" "}
          </h1>
          <span className="text-sm">
            {open ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </span>
        </button>

        {/* Lista de opções */}
        <ul
          className={`
              absolute bottom-full mb-1 left-1/2 -translate-x-1/2
              bg-lightDark
              rounded-sm overflow-hidden
              min-w-[11rem] z-50
              shadow-lg
              transition-opacity duration-200 ease-in-out
              ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
            `}
        >
          {languages.map((lang) => (
            <li
              key={lang.value}
              onClick={() => {
                setLang(lang.value);
                setOpen(false);
              }}
              className={`
                    px-6 py-2
                    font-bold font-istok-web text-lg
                    cursor-pointer select-none
                    transition-colors duration-150
                    hover:bg-brand/70 hover:text-white
                    ${selected.value === lang.value ? "bg-lightDark/50" : ""}
                  `}
            >
              {lang.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Copyright */}
      <div className="select-none flex flex-row text-md text-center xl:text-md pt-24">
        © {new Date().getFullYear()} {t(lang, "Footer.copyright")}
      </div>
    </footer>
  );
}
