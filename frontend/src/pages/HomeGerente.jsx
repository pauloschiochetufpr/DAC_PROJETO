import { useTheme } from "../hooks/useTheme";
import { useLanguage } from "../hooks/useLanguage";

export default function HomeGerente() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="h-[50rem] w-full flex items-center justify-end p-20 bg-gradient-to-tr from-brand/40 to-transparent relative
                      "
      >
        <div className="shadow-lg w-[40rem] h-[40rem] absolute left-0 bottom-0"></div>
        <div
          className="w-[45rem] h-[35rem] bg-gradient-to-b from-secundaryDark to-secundary
                    shadow-lg shadow-secundaryDark/30 rounded-2xl p-2 flex flex-col z-[100]"
        >
          <div className="bg-green-300 h-[6rem] rounded-t-xl w-full"></div>
          <div className="bg-brandDark flex-1 rounded-b-xl">
            <h1>item 1</h1>
          </div>
        </div>
      </div>

      <div className="w-full h-[50rem] bg-lightDark"></div>
      <button
        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        Toggle theme
      </button>

      <button
        className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700"
        onClick={() => setLang(lang === "pt" ? "en" : "pt")}
      >
        Toggle language
      </button>
    </div>
  );
}
