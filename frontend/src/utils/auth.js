export function getUsuarioLogado() {
  const auth = localStorage.getItem("auth");

  if (!auth) return null;

  return JSON.parse(auth);
}

export function getCpfUsuario() {
  return getUsuarioLogado()?.usuario?.cpf || null;
}
