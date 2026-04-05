// ISO-8601 BRT → { dataFormatada: "DD/MM/YYYY", horario: "HH:MM:SS" }
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

// Timestamp (ms) → ISO-8601 com offset BRT (-03:00)
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
