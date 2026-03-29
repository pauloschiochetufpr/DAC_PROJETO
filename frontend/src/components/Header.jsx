import Logo from "../assets/logo/logoEscura.svg";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../lib/i18n";

export default function Header() {
  const { lang } = useLanguage();

  return (
    <header
      className="h-[10rem] md:h-[12rem] px-4 md:px-14 flex items-center absolute top-0 left-0 w-full z-[10000]
                      bg-brand/20 border-b-2 border-red-600
                      shadow-lg shadow-black/15"
    >
      <div className="z-[-10] w-full h-full absolute top-0 left-0 flex flex-row">
        <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-t from-transparent to-black/40 z-[1]"></div>
        <div className="absolute left-0 top-0 w-full h-full bg-white/[0.05] z-[2]"></div>
        <div className=" bg-gradient-to-r from-transparent to-red-500/25 w-[50%] h-full"></div>
        <div className=" bg-gradient-to-l from-transparent to-red-500/25 flex-1"></div>
      </div>
      <div className="z-[-11] w-full h-full absolute top-0 left-0 flex flex-row">
        <div className=" bg-gradient-to-l from-transparent to-black/30 w-[50%] h-full"></div>
        <div className=" bg-gradient-to-r from-transparent to-black/30 flex-1"></div>
      </div>

      {/* Identidade */}
      <div className="flex items-center md:justify-start justify-center h-full w-full select-none gap-8">
        <img src={Logo} alt="MasterBank" className="h-32" />
        <div className="flex-col justify-center items-start flex-1 hidden md:flex">
          <h1
            className="font-long-cang text-3xl lg:5xl 2xl:text-5xl text-secundary dark:text-secundary 
                        ml-10"
          >
            {t(lang, "Header.title")}
          </h1>
          <h1
            className="font-long-cang text-2xl lg:text-3xl 2xl:text-4xl text-secundary dark:text-secundary
                      md:ml-16 lg:ml-32 xl:ml-48 mt-2"
          >
            {t(lang, "Header.subtitle")}
          </h1>
        </div>
      </div>
    </header>
  );
}
