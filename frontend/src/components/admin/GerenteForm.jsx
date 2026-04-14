import { useState } from "react";
import {
  createGerente,
  updateGerente,
  deleteGerente,
} from "../../mocks/adminMockData";

// SVG's
import WaveSimpleRedReverse from "../WaveSimpleRedReverse";

// Lucide
import { AlertCircle } from "lucide-react";

// Componente principal
export default function GerenteForm({
  gerenteSelecionado,
  onRefresh,
  onClear,
}) {
  // Formatadores
  const cpfMask = (cpf) =>
    String(cpf).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

  const telefoneMask = (tel) => {
    const d = String(tel).replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10)
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const [form, setForm] = useState({
    id: null,
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    senha: "",
  });

  const setGerenteSelecionado = () => {
    onClear?.();
  };

  const [prevGerenteSelecionado, setPrevGerenteSelecionado] =
    useState(gerenteSelecionado);
  if (gerenteSelecionado !== prevGerenteSelecionado) {
    setPrevGerenteSelecionado(gerenteSelecionado);
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
  }

  const handleSalvar = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      alert("E-mail inválido. Verifique o formato (ex: usuario@dominio.com)");
      return;
    }

    let res;

    if (form.id) {
      res = await updateGerente(form.id, form);
    } else {
      res = await createGerente(form);
    }

    if (res.status === 200 || res.status === 201) {
      onRefresh?.();
      onClear?.();
    } else {
      alert(res.message);
    }
  };

  const handleExcluir = async () => {
    const res = await deleteGerente(form.id);

    if (res.status === 200) {
      onRefresh?.();
      onClear?.();
    } else {
      alert(res.message);
    }
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
          <h2 className="font-orienta text-xl md:text-3xl text-secundary">
            {form.id ? "Editar Gerente" : "Cadastrar Gerente"}
          </h2>
        </div>
      </div>

      {/* Painéis de dados */}
      <div className="flex flex-col gap-4 transition-all duration-300 select-none">
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
              warningMessage="O e-mail deve conter '@' e um domínio válido (ex: usuario@dominio.com)"
              warn={
                form.email.length > 0 &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
              }
            />

            <Input
              label="Telefone"
              value={form.telefone ? telefoneMask(form.telefone) : ""}
              onChange={(v) =>
                setForm({
                  ...form,
                  telefone: v.replace(/\D/g, "").slice(0, 11),
                })
              }
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
            className="bg-secundaryDark hover:bg-secundary px-4 py-2 h-[2.6rem] rounded-sm text-white font-semibold"
          >
            {form.id ? "Atualizar" : "Criar"}
          </button>

          {form.id && (
            <button
              onClick={handleExcluir}
              className="bg-brand/20 px-4 py-2 h-[2.6rem] hover:bg-brand border border-brand
              rounded-sm text-white"
            >
              Excluir
            </button>
          )}
          {form.id != null && (
            <button
              onClick={() => setGerenteSelecionado()}
              className="bg-secundary/20 hover:bg-secundary/80 px-4 py-2 h-[2.6rem] rounded-sm border border-secundary/80
              active:bg-secundary
              text-white font-semibold"
            >
              Novo Gerente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Campos
function Input({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
  warningMessage,
  warn = false,
}) {
  const [showWarning, setShowWarning] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-secundary text-xs font-inter">{label}</span>
      <div className="relative">
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="bg-brand/30 border border-secundary/60 rounded-sm outline-none px-3 py-2 text-white text-sm w-full
                    focus:border-secundary"
        />
        {warningMessage && warn && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300 transition-colors"
            onMouseEnter={() => setShowWarning(true)}
            onMouseLeave={() => setShowWarning(false)}
          >
            <AlertCircle size={16} />
          </button>
        )}
      </div>
      {showWarning && warningMessage && warn && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div
            className="bg-brandDark/80 border border-yellow-400/70 rounded-xl px-8 py-5
                       shadow-2xl shadow-black/60 max-w-xs text-center flex flex-col items-center gap-3"
          >
            <AlertCircle className="text-yellow-400" size={28} />
            <p className="text-white text-sm font-inter leading-relaxed">
              {warningMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
