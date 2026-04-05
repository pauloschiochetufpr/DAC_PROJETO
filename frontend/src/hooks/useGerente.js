import { useContext } from "react";
import { GerenteContext } from "../context/gerente.context";

export function useGerente() {
  const ctx = useContext(GerenteContext);
  if (!ctx)
    throw new Error("useGerente deve ser usado dentro de <GerenteProvider>");
  return ctx;
}
