import { useEffect, useState } from "react";
import { LanguageContext } from "./language.context";

function getInitialLang() {
  const saved = localStorage.getItem("lang");
  if (saved) return saved;

  return navigator.language.startsWith("pt") ? "pt" : "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
