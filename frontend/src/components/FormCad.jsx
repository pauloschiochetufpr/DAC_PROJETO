import { useState } from "react";

function formatCPF(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function formatCEP(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

function formatSalary(value) {
  const cleaned = value.replace(/\D/g, "");
  const number = (Number(cleaned) / 100).toFixed(2);
  return `R$ ${number}`;
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  full,
}) {
  return (
    <div className={`group flex flex-col gap-1 ${full ? "md:col-span-2" : ""}`}>
      <label className="text-secundary text-sm">{label}</label>
      <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 transition-all duration-300 group-hover:border-orange-300/40 focus-within:border-orange-300/60 focus-within:shadow-[0_0_10px_rgba(255,120,80,0.25)]">
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-400"
        />
      </div>
    </div>
  );
}

export default function FormCad() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    salario: "",
  });

  function handleChange(e) {
    let { name, value } = e.target;

    if (name === "cpf") value = formatCPF(value);
    if (name === "telefone") value = formatPhone(value);
    if (name === "cep") value = formatCEP(value);
    if (name === "salario") value = formatSalary(value);

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function canNext() {
    if (step === 1) {
      return form.nome && form.cpf && form.email && form.telefone;
    }
    if (step === 2) {
      return (
        form.cep && form.logradouro && form.numero && form.cidade && form.estado
      );
    }
    if (step === 3) {
      return form.salario;
    }
    return false;
  }

  function nextStep() {
    if (canNext()) setStep((s) => Math.min(s + 1, 3));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!canNext()) return;

    setLoading(true);

    try {
      console.log("Cadastro:", form);
      await new Promise((res) => setTimeout(res, 1000));
      setStep(4);
    } catch {
      setError("Erro ao enviar cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-6">
      {/* STEP INDICATOR */}
      <div className="flex justify-center gap-4 text-sm">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`px-3 py-1 rounded-full border ${
              step === s
                ? "text-secundary border-secundary"
                : "text-zinc-400 border-white/10"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Seu nome"
            full
          />
          <Field
            label="CPF"
            name="cpf"
            value={form.cpf}
            onChange={handleChange}
            placeholder="000.000.000-00"
          />
          <Field
            label="Telefone"
            name="telefone"
            value={form.telefone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="email@email.com"
            full
          />
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="CEP"
            name="cep"
            value={form.cep}
            onChange={handleChange}
            placeholder="00000-000"
          />
          <Field
            label="Número"
            name="numero"
            value={form.numero}
            onChange={handleChange}
            placeholder="123"
          />

          <Field
            label="Logradouro"
            name="logradouro"
            value={form.logradouro}
            onChange={handleChange}
            placeholder="Rua..."
            full
          />
          <Field
            label="Complemento"
            name="complemento"
            value={form.complemento}
            onChange={handleChange}
            placeholder="Apto..."
            full
          />

          <Field
            label="Cidade"
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            placeholder="Cidade"
          />
          <Field
            label="Estado"
            name="estado"
            value={form.estado}
            onChange={handleChange}
            placeholder="Estado"
          />
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="grid grid-cols-1 gap-4">
          <Field
            label="Salário"
            name="salario"
            value={form.salario}
            onChange={handleChange}
            placeholder="R$ 0.00"
            full
          />
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="flex flex-col items-center justify-center gap-6 text-center py-10">
          <h2 className="text-2xl font-orienta text-secundary">
            Cadastro enviado!
          </h2>
          <p className="text-zinc-300 max-w-lg">
            Sua solicitação foi enviada para análise. Você receberá um e-mail
            quando o processo for concluído.
          </p>
        </div>
      )}

      {/* ERROR */}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* NAVIGATION */}
      {step !== 4 && (
        <div className="flex justify-between mt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="text-zinc-300 hover:text-white"
            >
              Voltar
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canNext()}
              className="ml-auto px-4 py-2 border border-secundaryDark text-secundary rounded-lg disabled:opacity-40"
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !canNext()}
              className="ml-auto px-6 py-3 border-2 border-secundaryDark text-secundary rounded-full hover:shadow-lg hover:shadow-brandDark disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Finalizar"}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
