import { useState } from "react";
import { useBanco } from "../../hooks/useBanco";
import { useNavigate } from "react-router-dom";

// Lucide icon's
import { Eye, EyeClosed } from "lucide-react";

export default function FormLogin() {
  const [form, setForm] = useState({
    email: "",
    senha: "",
  });

  const { login } = useBanco();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      // eslint-disable-next-line
      const user = await login(form.email, form.senha);

      // Redireciona após login
      navigate("/");
    } catch (err) {
      setError(err.message || "Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* EMAIL */}
      <div className="group flex flex-col gap-1">
        <label htmlFor="email" className="text-secundary text-sm">
          Email
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
            placeholder="seu@email.com"
            className="w-full bg-transparent outline-none text-zinc-100 placeholder-zinc-400"
          />
        </div>
      </div>

      {/* SENHA */}
      <div className="group flex flex-col gap-1">
        <label htmlFor="senha" className="text-secundary text-sm">
          Senha
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
            placeholder="********"
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
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
