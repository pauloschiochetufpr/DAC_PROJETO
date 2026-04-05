/**
 * Converte uma string ISO-8601 com offset BRT para os campos de exibição
 * do extrato, no padrão brasileiro.
 * Formato esperado (igual ao retornado pelo backend): "2026-03-31T10:30:00-03:00"
 *
 * @param {string} isoString
 * @returns {{ dataFormatada: string, horario: string }}
 *   - dataFormatada: "DD/MM/YYYY"  (ex.: "31/03/2026")
 *   - horario:       "HH:MM:SS"    (ex.: "10:30:00")
 */
export const formatarData = (isoString) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(isoString));

  const v = (type) => parts.find((p) => p.type === type)?.value;

  return {
    dataFormatada: `${v("day")}/${v("month")}/${v("year")}`,
    horario: `${v("hour")}:${v("minute")}:${v("second")}`,
  };
};

/**
 * Converte um timestamp em milissegundos para uma string ISO-8601
 * com offset fixo de Brasília (-03:00).
 * Usado internamente para gerar mocks e registrar novas transações.
 *
 * @param {number} ts
 * @returns {string}  ex.: "2026-03-31T10:30:00-03:00"
 */
export const toBrasiliaIso = (ts) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ts));

  const v = (type) => parts.find((p) => p.type === type)?.value;
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}:${v("second")}-03:00`;
};
