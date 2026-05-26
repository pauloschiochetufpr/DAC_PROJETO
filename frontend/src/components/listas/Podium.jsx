const PODIUM_VAZIO = [
  {
    id: "empty-2",
    nome: "N/A",
    cpf: "---",
    cidade: "---",
    estado: "--",
    saldo: 0,
  },
  {
    id: "empty-1",
    nome: "N/A",
    cpf: "---",
    cidade: "---",
    estado: "--",
    saldo: 0,
  },
  {
    id: "empty-3",
    nome: "N/A",
    cpf: "---",
    cidade: "---",
    estado: "--",
    saldo: 0,
  },
];

export default function Podium({ clientes, erro }) {
  // Formatadores
  const cpfMask = (cpf) => {
    if (!cpf || cpf.length !== 11) return cpf;

    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  };

  const fmtBRL = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });

  // Const's de style
  const heights = ["h-[10.5rem]", "h-[12.5rem]", "h-[8.5rem]"];
  const labels = ["2º", "1º", "3º"];
  const colors = ["border-gray-300", "border-yellow-400", "border-amber-600"];

  if (erro) return <p className="text-center text-red-500">{erro}</p>;

  const dadosBase = clientes.length > 0 ? [...clientes] : [...PODIUM_VAZIO];

  while (dadosBase.length < 3) {
    dadosBase.push(PODIUM_VAZIO[dadosBase.length]);
  }

  const ordenados = [...dadosBase].sort((a, b) => b.saldo - a.saldo);

  const dados = [ordenados[1], ordenados[0], ordenados[2]];

  return (
    <div className="flex items-end justify-center gap-4 sm:scale-100 scale-[65%] select-none">
      {dados.map((cliente, i) => (
        <div
          key={cliente.id ?? cliente.cpf}
          className="flex flex-col items-center"
        >
          {/* Info do cliente */}
          <div className="mb-2 text-center text-sm">
            <p className="font-bold text-base">{cliente.nome}</p>
          </div>

          {/* Bloco do pódio */}
          <div
            className={`${heights[i]} ${colors[i]} border-2 flex flex-col
            items-center rounded-t-md rounded-b-sm w-fit min-w-[9em] px-3 pt-3 justify-between text-nowrap`}
          >
            <div className="flex flex-col items-center justify-start h-fit w-full overflow-hidden">
              <p>{cpfMask(cliente.cpf)}</p>
              <p>
                {cliente.cidade}/{cliente.estado}
              </p>
              <p className="font-semibold">R$ {fmtBRL(cliente.saldo)}</p>
            </div>
            <span className="pb-2 text-2xl font-bold select-none    ">
              {labels[i]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
