import { usuariosMock } from "../mocks/authMockData";

export function loginMock(email, senha) {
  return new Promise((resolve, reject) => {
    const user = usuariosMock.find(
      (u) => u.email === email && u.senha === senha,
    );

    if (!user) {
      reject({ message: "Email ou senha inválidos" });
      return;
    }

    resolve({
      email: user.email,
      tipo: user.tipo,
      nome: user.nome,
    });
  });
}
