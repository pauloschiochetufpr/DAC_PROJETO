import { useState, useRef, useEffect, useMemo } from "react";

// Mock's
import { useGerente } from "../../hooks/useGerente";

// SVG's
import WaveSimpleRedReverse from "../WaveSimpleRedReverse";

// Lucide
import {
  Search,
  LoaderCircle,
  Copy,
  UserRoundX,
  UserRoundSearch,
} from "lucide-react";

// Componente principal
export default function GerenteForm({ gerenteSelecionado }) {
  // Formatadores
  const cpfMask = (cpf) =>
    String(cpf).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

  const [form, setForm] = useState({
    id: null,
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    senha: "",
  });

  useEffect(() => {
    if (gerenteSelecionado) {
      setForm({
        ...gerenteSelecionado,
        senha: "",
      });
    } else {
      setForm({
        id: null,
        nome: "",
        cpf: "",
        email: "",
        telefone: "",
        senha: "",
      });
    }
  }, [gerenteSelecionado]);

  const handleSalvar = () => {
    if (!form.nome || !form.cpf || !form.email || !form.telefone) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (!form.id && !form.senha) {
      alert("Senha é obrigatória para novo gerente");
      return;
    }

    if (form.id) {
      console.log("UPDATE", form);
    } else {
      console.log("CREATE", form);
    }
  };

  const handleExcluir = () => {
    if (!form.id) return;

    // regra simulada
    const totalGerentes = 1; // depois vem do contexto

    if (totalGerentes <= 1) {
      alert("Não é possível remover o último gerente");
      return;
    }

    console.log("DELETE", form.id);
  };

  return (
    <div className="flex flex-col w-full gap-6 py-10 px-6">
      {/* Cabeçalho */}
      <div className="bg-transparent h-[10rem] xl:h-[7rem] w-full"></div>
      <div
        className=" h-[10rem] xl:h-[7rem] absolute top-0 left-0 sm:rounded-t-2xl
        w-full px-2 xl:px-6 py-4 overflow-hidden shadow-black/40 shadow-lg z-[15]"
      >
        <div className="absolute left-0 top-0 w-full h-full bg-white/[0.05] z-[14]"></div>
        <div className="absolute left-0 top-0 w-full h-full flex flex-row z-[13]">
          <div className=" w-[50%] h-full bg-gradient-to-r from-transparent to-white/[0.14] z-[13]"></div>
          <div className=" flex-1 bg-gradient-to-l from-transparent to-white/[0.14] z-[13]"></div>
        </div>
        <div className="absolute left-0 top-0 w-full h-full flex flex-row z-[13]">
          <div className=" w-[50%] h-full bg-gradient-to-l from-transparent to-black/[0.32] z-[13]"></div>
          <div className=" flex-1 bg-gradient-to-r from-transparent to-black/[0.32] z-[13]"></div>
        </div>
        <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-t from-transparent to-black/40 z-[12]"></div>
        <WaveSimpleRedReverse className="z-[-3]" />
        <div
          className=" absolute rounded-md bg-black/50 shadow-black/60 shadow-inner px-4 py-3 
        md:w-fit w-[14rem] h-fit select-none z-[200] left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
        >
          <h2 className="text-white text-2xl font-orienta">
            {form.id ? "Editar Gerente" : "Cadastrar Gerente"}
          </h2>
        </div>
      </div>

      {/* Painéis de dados */}
      <div
        className={`flex flex-col gap-4 transition-all duration-300 select-none
                    "opacity-35 select-none"}`}
      >
        {/* Dados Pessoais */}
        <div className="bg-brandDark border-2 border-secundary rounded-sm p-5">
          <h3
            className="text-secundary font-semibold font-inter mb-4 text-sm uppercase
                       tracking-wider border-b border-secundary/60 pb-2"
          >
            Dados Pessoais
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input
              label="CPF"
              value={form.cpf ? cpfMask(form.cpf) : ""}
              disabled={!!form.id}
              onChange={(v) => setForm({ ...form, cpf: v })}
            />

            <Input
              label="Nome"
              value={form.nome}
              onChange={(v) => setForm({ ...form, nome: v })}
            />

            <Input
              label="E-mail"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />

            <Input
              label="Telefone"
              value={form.telefone}
              onChange={(v) => setForm({ ...form, telefone: v })}
            />

            <Input
              label="Senha"
              value={form.senha}
              type="password"
              onChange={(v) => setForm({ ...form, senha: v })}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSalvar}
            className="bg-secundary px-4 py-2 rounded text-black font-semibold"
          >
            {form.id ? "Atualizar" : "Criar"}
          </button>

          {form.id && (
            <button
              onClick={handleExcluir}
              className="bg-red-600 px-4 py-2 rounded text-white"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Campos
function Input({ label, value, onChange, disabled = false, type = "text" }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-secundary text-xs font-inter">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="bg-brand/30 border border-secundary/60 rounded px-3 py-2 text-white text-sm"
      />
    </div>
  );
}
