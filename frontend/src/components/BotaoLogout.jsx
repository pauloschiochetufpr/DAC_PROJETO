import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { logoutAtomico } from "../services/logoutService";

export default function BotaoLogout({ className = "", mostrarTexto = true }) {
  const navigate = useNavigate();
  const { limparUsuario } = useAuth();

  const [saindo, setSaindo] = useState(false);

  const handleLogout = async () => {
    if (saindo) return;

    try {
      setSaindo(true);

      await logoutAtomico({
        limparUsuario,
        navigate,
      });
    } finally {
      setSaindo(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={saindo}
      title="Sair"
      className={`flex items-center justify-center gap-2
                  px-4 py-2 rounded-sm
                  bg-red-900/30 border border-red-500/50
                  text-red-200 font-inter font-semibold
                  hover:bg-red-800/50 active:bg-red-800
                  transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${className}`}
    >
      <LogOut size={18} />

      {mostrarTexto && <span>{saindo ? "Saindo..." : "Sair"}</span>}
    </button>
  );
}
