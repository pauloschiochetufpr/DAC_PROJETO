import { useState } from "react";
import { ClienteService } from "../../services/ClienteService";

// i18n
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../lib/i18n";

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
  const digits = onlyDigits(value);
  const number = Number(digits || 0) / 100;

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function onlyDigits(value) {
  return (value || "").replace(/\D/g, "");
}

function parseSalary(value) {
  const digits = onlyDigits(value);
  return digits ? Number(digits) / 100 : 0;
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  full,
  autoComplete,
}) {
  return (
    <div className={`group flex flex-col gap-1 ${full ? "md:col-span-2" : ""}`}>
      <label htmlFor={name} className="text-secundary text-sm">
        {label}
      </label>
      <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 transition-all duration-300 group-hover:border-orange-300/40 focus-within:border-orange-300/60 focus-within:shadow-[0_0_10px_rgba(255,120,80,0.25)]">
        <input
          type={type}
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-400"
        />
      </div>
    </div>
  );
}

export default function FormCad() {
  const { lang } = useLanguage();
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
    bairro: "",
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
        form.cep &&
        form.logradouro &&
        form.numero &&
        form.bairro &&
        form.cidade &&
        form.estado
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

    const cpf = onlyDigits(form.cpf);
    const telefone = onlyDigits(form.telefone);
    const cep = onlyDigits(form.cep);
    const salario = parseSalary(form.salario);

    if (cpf.length !== 11) {
      setError("Informe um CPF válido.");
      return;
    }

    if (telefone.length < 10) {
      setError("Informe um telefone válido.");
      return;
    }

    if (cep.length !== 8) {
      setError("Informe um CEP válido.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (salario <= 0) {
      setError("Informe um salário válido.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nome: form.nome.trim(),
        cpf,
        email: form.email.trim().toLowerCase(),
        telefone,
        salario,

        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        bairro: form.bairro.trim(),
        cep,
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
      };

      await ClienteService.autocadastrar(payload);

      setStep(4);
    } catch (err) {
      setError(
        err.message || t(lang, "LoginPage.register.errors.submit_error"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
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
            label={t(lang, "LoginPage.register.fields.nome.label")}
            placeholder={t(lang, "LoginPage.register.fields.nome.placeholder")}
            name="nome"
            type="text"
            value={form.nome}
            onChange={handleChange}
            autoComplete="name"
            full
          />
          <Field
            label={t(lang, "LoginPage.register.fields.cpf.label")}
            placeholder={t(lang, "LoginPage.register.fields.cpf.placeholder")}
            name="cpf"
            value={form.cpf}
            onChange={handleChange}
            autoComplete="off"
          />
          <Field
            label={t(lang, "LoginPage.register.fields.telefone.label")}
            placeholder={t(
              lang,
              "LoginPage.register.fields.telefone.placeholder",
            )}
            name="telefone"
            value={form.telefone}
            onChange={handleChange}
            autoComplete="tel"
          />
          <Field
            label={t(lang, "LoginPage.register.fields.email.label")}
            placeholder={t(lang, "LoginPage.register.fields.email.placeholder")}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            full
          />
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label={t(lang, "LoginPage.register.fields.cep.label")}
            placeholder={t(lang, "LoginPage.register.fields.cep.placeholder")}
            name="cep"
            value={form.cep}
            onChange={handleChange}
            autoComplete="postal-code"
          />
          <Field
            label={t(lang, "LoginPage.register.fields.numero.label")}
            placeholder={t(
              lang,
              "LoginPage.register.fields.numero.placeholder",
            )}
            name="numero"
            value={form.numero}
            onChange={handleChange}
          />

          <Field
            label={t(lang, "LoginPage.register.fields.logradouro.label")}
            placeholder={t(
              lang,
              "LoginPage.register.fields.logradouro.placeholder",
            )}
            name="logradouro"
            value={form.logradouro}
            onChange={handleChange}
            autoComplete="street-address"
            full
          />
          <Field
            label={t(lang, "LoginPage.register.fields.complemento.label")}
            placeholder={t(
              lang,
              "LoginPage.register.fields.complemento.placeholder",
            )}
            name="complemento"
            value={form.complemento}
            onChange={handleChange}
            autoComplete="address-line2"
            full
          />
          <Field
            label={t(lang, "LoginPage.register.fields.bairro.label")}
            placeholder={t(
              lang,
              "LoginPage.register.fields.bairro.placeholder",
            )}
            name="bairro"
            value={form.bairro}
            onChange={handleChange}
            autoComplete="address-level3"
          />
          <Field
            label={t(lang, "LoginPage.register.fields.cidade.label")}
            placeholder={t(
              lang,
              "LoginPage.register.fields.cidade.placeholder",
            )}
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            autoComplete="address-level2"
          />
          <Field
            label={t(lang, "LoginPage.register.fields.estado.label")}
            placeholder={t(
              lang,
              "LoginPage.register.fields.estado.placeholder",
            )}
            name="estado"
            value={form.estado}
            onChange={handleChange}
            autoComplete="address-level1"
          />
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="grid grid-cols-1 gap-4">
          <Field
            label={t(lang, "LoginPage.register.fields.salario.label")}
            placeholder={t(
              lang,
              "LoginPage.register.fields.salario.placeholder",
            )}
            name="salario"
            value={form.salario}
            onChange={handleChange}
            full
          />
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="flex flex-col items-center justify-center gap-6 text-center py-10">
          <h2 className="text-2xl font-orienta text-secundary">
            {t(lang, "LoginPage.register.success.title")}
          </h2>
          <p className="text-zinc-300 max-w-lg">
            {t(lang, "LoginPage.register.success.description")}
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
              className="text-white ml-2 rounded-sm px-5 bg-secundary/0
              hover:bg-secundaryDark/50 transition-colors duration-150"
            >
              {t(lang, "LoginPage.register.actions.back")}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canNext()}
              className={`ml-auto px-4 py-2 border border-secundaryDark bg-secundaryDark/40
              text-white rounded-sm disabled:opacity-40 transition-colors duration-150
              ${!canNext() ? "" : "cursor-pointer hover:bg-secundaryDark/50"}
              
              `}
            >
              {t(lang, "LoginPage.register.actions.next")}
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !canNext()}
              className="ml-auto px-6 py-3 border-2 border-secundaryDark
             text-secundary rounded-full hover:shadow-lg
             hover:shadow-brandDark disabled:opacity-50"
            >
              {loading
                ? t(lang, "LoginPage.register.actions.loading")
                : t(lang, "LoginPage.register.actions.submit")}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
