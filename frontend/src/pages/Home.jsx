import { useTheme } from "../hooks/useTheme";
import { useLanguage } from "../hooks/useLanguage";
import { t } from "../lib/i18n";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();

  return (
    <div className="p-4 space-y-4 ">
      <h1 className="text-2xl font-bold">{t(lang, "home.title")}</h1>

      <p>{t(lang, "home.subtitle")}</p>

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
