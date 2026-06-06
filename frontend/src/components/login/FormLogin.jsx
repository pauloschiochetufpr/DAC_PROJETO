import { useState } from "react";
import { useNavigate } from "react-router-dom";

// API
import { API } from "../../config";

// Lucide icon's
import { Eye, EyeClosed } from "lucide-react";

// i18n
import { useLanguage } from "../../hooks/useLanguage";
import { t } from "../../lib/i18n";
// useAuth
import { useAuth } from "../../hooks/useAuth";

export default function FormLogin() {
  // I18N
  const { lang } = useLanguage();
  const { salvarUsuario } = useAuth();
  const [form, setForm] = useState({
    email: "",
    senha: "",
  });

  // Navegação
  const navigate = useNavigate();

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  //Chamada API
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.login(form.email, form.senha);
      if (response.data?.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        // timestamp de expiração calculado no cliente; usado pelo useRefresh para controle de vida útil
        localStorage.setItem("access_token_exp", String(Date.now() + 600_000));
      }
      if (response.data?.tipo || response.data?.usuario) {
        salvarUsuario({
          tipo: response.data?.tipo ?? response.data?.usuario?.tipo ?? null,
          nome: response.data?.usuario?.nome ?? null,
          cpf: response.data?.usuario?.cpf ?? null,
          email: response.data?.usuario?.email ?? form.email,
        });
      }
      navigate("/");
    } catch (err) {
      const errorKey = err.response?.data?.code || "invalid_credentials";
      setError(t(lang, `LoginPage.login.errors.${errorKey}`));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* EMAIL */}
      <div className="group flex flex-col gap-1">
        <label htmlFor="email" className="text-secundary text-sm">
          {t(lang, "LoginPage.login.fields.email.label")}
        </label>
        <div
          className="rounded-lg px-3 py-2 bg-white/5 border border-white/10
          transition-all duration-300
          group-hover:border-orange-300/40
          focus-within:border-orange-300/60
          focus-within:shadow-[0_0_10px_rgba(255,120,80,0.25)]"
        >
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder={t(lang, "LoginPage.login.fields.email.placeholder")}
            className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-400"
          />
        </div>
      </div>

      {/* SENHA */}
      <div className="group flex flex-col gap-1">
        <label htmlFor="senha" className="text-secundary text-sm">
          {t(lang, "LoginPage.login.fields.password.label")}
        </label>

        <div
          className="flex items-center rounded-lg px-3 py-2 bg-white/5 border border-white/10
          transition-all duration-300
          group-hover:border-orange-300/40
          focus-within:border-orange-300/60
          focus-within:shadow-[0_0_10px_rgba(255,120,80,0.25)]"
        >
          <input
            type={showPassword ? "text" : "password"}
            id="senha"
            name="senha"
            value={form.senha}
            onChange={handleChange}
            required
            autoComplete="current-password"
            placeholder={t(lang, "LoginPage.login.fields.password.placeholder")}
            className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-400"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="ml-2 text-xs text-zinc-300 hover:text-white transition"
          >
            {showPassword ? (
              <Eye className="text-secundary z-[100]" size={20} />
            ) : (
              <EyeClosed className="text-secundary z-[100]" size={20} />
            )}
          </button>
        </div>
      </div>

      {/* ERRO */}
      {error && <div className="text-red-400 text-sm text-center">{error}</div>}

      {/* BOTÃO */}
      <button
        type="submit"
        disabled={loading}
        className="relative mt-2 text-lg font-orienta px-6 py-3 rounded-sm
        border-2 border-secundaryDark
        text-secundary
        transition-all duration-200
        hover:shadow-lg hover:shadow-brandDark
        active:shadow-none
        disabled:opacity-50"
      >
        {loading
          ? t(lang, "LoginPage.login.actions.loading")
          : t(lang, "LoginPage.login.actions.submit")}
      </button>
    </form>
  );
}
