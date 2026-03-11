import { useTheme } from "../hooks/useTheme";
import { useLanguage } from "../hooks/useLanguage";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();

  return (
    <header className="h-14 px-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
      {/* Identidade */}
      <div className="font-semibold">ProjectName</div>

      {/* Controles globais */}
      <div className="flex items-center gap-2">
        <button
          className="text-sm px-2 py-1 border rounded"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme}
        </button>

        <button
          className="text-sm px-2 py-1 border rounded"
          onClick={() => setLang(lang === "pt" ? "en" : "pt")}
        >
          {lang}
        </button>
      </div>
    </header>
  );
}
