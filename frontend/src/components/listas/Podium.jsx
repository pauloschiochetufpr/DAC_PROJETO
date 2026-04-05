import { useState, useEffect } from "react";
import { useGerente } from "../../hooks/useGerente";

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

export default function Podium() {
  // Formatadores
  const cpfMask = (cpf) =>
    cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

  // Render da "chamada" do mock
  const { getClientesFiltrados } = useGerente();

  //estados e listas
  const [top3, setTop3] = useState([]);
  const [erro, setErro] = useState(null);

  //Chamada falsa
  useEffect(() => {
    getClientesFiltrados("melhores_clientes").then((res) => {
      if (res.status === 200) {
        setTop3(res.data);
        setErro(null);
      } else if (res.status === 401) {
        setErro("O usuário não está logado");
      } else if (res.status === 403) {
        setErro("O usuário não tem permissão para efetuar esta operação");
      } else {
        setErro(res.message ?? "Erro ao buscar melhores clientes");
      }
    });
  }, [getClientesFiltrados]);

  // Const's de style
  const heights = ["h-[10.5rem]", "h-[12.5rem]", "h-[8.5rem]"];
  const labels = ["2º", "1º", "3º"];
  const colors = ["border-gray-300", "border-yellow-400", "border-amber-600"];

  if (erro) return <p className="text-center text-red-500">{erro}</p>;

  const vazio = top3.length < 3;
  const dados = vazio ? PODIUM_VAZIO : [top3[1], top3[0], top3[2]];

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
              <p className="font-semibold">
                R${" "}
                {cliente.saldo.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
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
