import { useMemo } from "react";
import { clientesAdminData } from "../../mocks/adminMockData";

// Cores do gráfico
const COR_POSITIVO = "#4ade80"; // green-400 (Tailwind css)
const COR_NEGATIVO = "#f87171"; // red-400 (Tailwind css)
const COR_NEUTRO = "#a3a3a3"; // neutral-400 (Tailwind css)

// Dado pronto (derivado do mock, não muda em runtime nessa tela)
function calcularTotais(clientes) {
  let positivos = 0,
    negativos = 0,
    neutros = 0;
  for (const c of clientes) {
    if (c.saldo > 0) positivos++;
    else if (c.saldo < 0) negativos++;
    else neutros++;
  }
  return { positivos, negativos, neutros };
}

// Calcula os paths SVG
function calcularPaths(fatias, total, cx, cy, r) {
  const { paths } = fatias
    .filter((f) => f.valor > 0)
    .reduce(
      (acc, fatia) => {
        const angulo = (fatia.valor / total) * 2 * Math.PI;
        const inicio = acc.acumulado;
        const fim = acc.acumulado + angulo;
        const x1 = cx + r * Math.cos(inicio);
        const y1 = cy + r * Math.sin(inicio);
        const x2 = cx + r * Math.cos(fim);
        const y2 = cy + r * Math.sin(fim);
        const largeArc = angulo > Math.PI ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
        return {
          acumulado: fim,
          paths: [...acc.paths, { ...fatia, d }],
        };
      },
      { acumulado: -Math.PI / 2, paths: [] },
    );
  return paths;
}

// SVG de pizza simples sem dependências
function PizzaSVG({ fatias }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  if (total === 0) return null;

  const cx = 50,
    cy = 50,
    r = 45;
  const paths = calcularPaths(fatias, total, cx, cy, r);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      {paths.map((p) => (
        <path key={p.label} d={p.d} fill={p.cor} opacity={0.9} />
      ))}
      {/* Anel central */}
      <circle cx={cx} cy={cy} r={22} fill="#1a0505" />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="top"
        fontSize="12"
        fill="#ebebeb"
        fontFamily="sans-serif"
        fontWeight="bold"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        dominantBaseline="top"
        fontSize="6"
        fill="#9c9c9c"
              fontFamily="sans-serif"
      >
        clientes
      </text>
    </svg>
  );
}

export default function GraficoSaldos() {
  const { positivos, negativos, neutros } = useMemo(
    () => calcularTotais(clientesAdminData),
    [],
  );

  const fatias = [
    { label: "Positivos", valor: positivos, cor: COR_POSITIVO },
    { label: "Negativos", valor: negativos, cor: COR_NEGATIVO },
    { label: "Neutros", valor: neutros, cor: COR_NEUTRO },
  ];

  const total = positivos + negativos + neutros;

  return (
    <div
      className="w-fit h-fit max-h-full max-w-full flex flex-col justify-center items-center
                    bg-brandDark/90 backdrop-blur-lg rounded-2xl select-none
                    border border-secundary/70 shadow-black/100 shadow-inner "
    >
      {/* Título */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <h2 className="font-orienta text-secundary text-base md:text-lg select-none">
          Distribuição de Saldos
        </h2>
      </div>

      {/* Pizza + legenda */}
      <div className="flex-1 flex items-center gap-4 px-4 pb-3 min-h-0">
        {/* Pizza */}
        <div className="h-full max-h-[9rem] aspect-square flex-shrink-0">
          <PizzaSVG fatias={fatias} />
        </div>

        {/* Legenda */}
        <div className="flex flex-col gap-2 font-inter text-sm select-none">
          {fatias.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: f.cor }}
              />
              <span className="text-contrast">{f.label}</span>
              <span className="text-contrastDark ml-auto pl-4 gap-2 flex flex-row justify-center items-center">
                {f.valor}
                <span className="text-xs ml-1 text-contrast/60">
                  ({total > 0 ? ((f.valor / total) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
