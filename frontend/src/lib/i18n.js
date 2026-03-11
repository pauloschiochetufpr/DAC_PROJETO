import pt from "../i18n/pt/pt.json";
import en from "../i18n/en/en.json";

export const dictionaries = { pt, en };

export function t(lang, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], dictionaries[lang]);
}
