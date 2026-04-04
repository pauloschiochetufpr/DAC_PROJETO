import { useContext } from "react";
import { BancoContext } from "../context/banco.context";

export function useBanco() {
  const ctx = useContext(BancoContext);
  if (!ctx)
    throw new Error("useBanco deve ser usado dentro de <BancoProvider>");
  return ctx;
}
