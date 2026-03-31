const tipos = ["saque", "deposito", "pagamento", "transferencia"];

const formatDateTimeParts = (timestamp) => {
  const date = new Date(timestamp);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const valueFrom = (type) => parts.find((part) => part.type === type)?.value;

  const year = valueFrom("year");
  const month = valueFrom("month");
  const day = valueFrom("day");
  const hour = valueFrom("hour");
  const minute = valueFrom("minute");
  const second = valueFrom("second");

  return {
    data: `${year}-${month}-${day}`,
    horario: `${hour}:${minute}:${second}`,
  };
};

const toBrasiliaIso = (date) => {
  const { data, horario } = formatDateTimeParts(date.toISOString());
  return `${data}T${horario}-03:00`;
};

const getRandomTimestamp = (index) => {
  const agora = new Date();
  const diasAtras = (index * 11 + 7) % 240;
  const minutosAtras = (index * 67 + 31) % (24 * 60);

  return new Date(
    agora.getTime() - (diasAtras * 24 * 60 + minutosAtras) * 60 * 1000,
  );
};

const registrosBase = Array.from({ length: 60 }, (_, seed) => {
  const referencia = seed + 1;
  const bruto = getRandomTimestamp(referencia);
  const data = toBrasiliaIso(bruto);
  const { data: dataFormatada, horario } = formatDateTimeParts(data);

  return {
    data,
    tipo: tipos[referencia % tipos.length],
    origem: String(1000 + ((referencia * 37) % 9000)),
    destino: String(1000 + ((referencia * 71) % 9000)),
    valor: Number((25 + ((referencia * 43) % 1950) + 0.37).toFixed(2)),
    dataFormatada,
    horario,
  };
});

export const extratoMockData = registrosBase
  .sort((itemA, itemB) => new Date(itemB.data) - new Date(itemA.data))
  .map((item, posicao, arrayOrdenado) => ({
    index: arrayOrdenado.length - posicao,
    data: item.data,
    tipo: item.tipo,
    origem: item.origem,
    destino: item.destino,
    valor: item.valor,
    dataFormatada: item.dataFormatada,
    horario: item.horario,
  }));
