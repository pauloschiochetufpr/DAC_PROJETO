import { createContext } from "react";

/**
 * Contexto do "banco de dados" em memória do protótipo.
 * Espelha o formato retornado pelo backend para /extrato.
 *
 * Valor exposto pelo BancoProvider:
 *   conta              → string           (número da conta, 4 dígitos)
 *   saldo              → number           (saldo atual em BRL)
 *   movimentacoes      → Movimentacao[]   (mais recente primeiro)
 *   adicionarTransacao → (TransacaoInput) => Promise<{ status, message }>
 *                        status 200 → sucesso | status 422 → saldo insuficiente
 *
 * Movimentacao {
 *   id:      string  // gerado pelo front (não existe no backend real)
 *   data:    string  // ISO-8601 com offset BRT — ex.: "2026-03-31T10:30:00-03:00"
 *   tipo:    string  // "saque" | "deposito" | "pagamento" | "transferencia"
 *   origem:  string
 *   destino: string
 *   valor:   number  // float americano bruto — formatação feita pelo Extrato
 *   descricao?: string
 * }
 */
export const BancoContext = createContext(null);
