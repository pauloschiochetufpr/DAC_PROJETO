import pt from "../i18n/pt/pt.json";
import en from "../i18n/en/en.json";

export const dictionaries = { pt, en };

export function t(lang, path, params = {}) {
  const value = path
    .split(".")
    .reduce((acc, key) => acc?.[key], dictionaries[lang]);

  if (!value) return path;

  // Interpolação {{variavel}}
  return value.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    return params[key.trim()] ?? "";
  });
}
