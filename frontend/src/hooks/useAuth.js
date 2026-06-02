import { useContext } from "react";

// AuthContext
import { AuthContext } from "../context/auth.context";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
