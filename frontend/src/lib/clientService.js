// Modelo base para interações com o backend relacionadas ao cliente
// Modificar quando o token JWT estiver implementado
export function getAuthToken() {
  try {
    return localStorage.getItem("token") || null;
  } catch (e) {
    return null;
  }
}

// Função para extrair o payload do token JWT, caso esteja presente e seja válido
export function getPayloadFromToken() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    return null;
  }
}

// Função para construir o DTO de cliente a partir do payload do token e dos dados do formulário
export function buildClientDTO(payloadFromToken, formData) {
  return {
    id: payloadFromToken?.id,
    cpf: payloadFromToken?.cpf,
    nome: formData.nome,
    email: formData.email,
    telefone: formData.telefone,
    salario: Number(formData.salario),
    saldo: Number(formData.saldo),
  };
}

// Função para atualizar os dados do cliente, usando o DTO construído a partir do token e do formulário
export async function updateClient(dto) {
  const token = getAuthToken();
  const res = await fetch("/api/clients", { // Mudar endpont para o correto quando a API estiver implementada
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
