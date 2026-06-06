import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Instância pública
const axiosPublic = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Instância protegida
const axiosAuth = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

axiosAuth.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Informações do dispositivo
async function getDeviceId() {
  // GPU via WebGL | identifica o modelo da placa, muito estável
  let gpuRenderer = "";
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) gpuRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    }
    // eslint-disable-next-line no-empty
  } catch {}

  // Apenas sinais de hardware imutáveis
  const signals = [
    navigator.platform, // Win32 / MacIntel / Linux x86_64
    navigator.hardwareConcurrency ?? "", // núcleos lógicos do CPU
    navigator.deviceMemory ?? "", // RAM em GB
    gpuRenderer, // modelo da GPU
  ].join("|");

  const encoded = new TextEncoder().encode(signals);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getDeviceName() {
  const ua = navigator.userAgent;

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navegador";

  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac/.test(ua)
          ? "MacOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Desconhecido";

  return `${browser} · ${os}`;
}

export const API = {
  // AUTH (público)
  /** POST /auth/login -> { email, password, deviceId, deviceName, ip } */
  login: async (email, password) => {
    const deviceId = await getDeviceId();
    return axiosPublic.post("/auth/login", {
      email,
      password,
      deviceId,
      deviceName: getDeviceName(),
    });
  },

  /** POST /auth/logout */
  logout: () => axiosPublic.post("/auth/logout"),

  /** POST /auth/refresh -> { access_token } */
  refresh: async () => {
    const deviceId = await getDeviceId();
    return axiosPublic.post("/auth/refresh", { deviceId });
  },

  // CONTA do CLIENTE (protegido)
  /** GET /contas/:numero/saldo */
  consultarSaldo: (numero) => axiosAuth.get(`/contas/${numero}/saldo`),

  /** POST /contas/:numero/depositar RequestBody */
  depositar: (numero, valor) =>
    axiosAuth.post(`/contas/${numero}/depositar`, { valor }),

  /** POST /contas/:numero/sacar RequestBody */
  sacar: (numero, valor) =>
    axiosAuth.post(`/contas/${numero}/sacar`, { valor }),

  /** POST /contas/:numero/transferir RequestBody */
  transferir: (numero, valor, destino) =>
    axiosAuth.post(`/contas/${numero}/transferir`, { valor, destino }),

  /** // GET /contas/:numero/extrato */
  consultarExtrato: (numero, dataInicio, dataFim) => {
    const params = {};
    if (dataInicio) params.dataInicio = dataInicio;
    if (dataFim) params.dataFim = dataFim;
    return axiosAuth.get(`/contas/${numero}/extrato`, { params });
  },

  // CLIENTE
  /** GET /clientes/:cpf */
  buscarPorCpf: (cpf) => axiosAuth.get(`/clientes/${cpf}`),

  /** GET /clientes */
  listar: () => axiosAuth.get("/clientes"),

  /** GET /clientes requestParams */
  listarComFiltro: (filtro) =>
    axiosAuth.get("/clientes", {
      params: { filtro },
    }),

  /** GET /clientes requestParams para_aprovar */
  listarPendentes: () =>
    API.listarClientesComParametro({
      filtro: "para_aprovar",
    }),

  /** POST /clientes/:cpf/aprovar */
  aprovar: (cpf) => axiosAuth.post(`/clientes/${cpf}/aprovar`),

  /** POST /clientes/:cpf/rejeitar */
  rejeitar: (cpf, motivo) =>
    axiosAuth.post(`/clientes/${cpf}/rejeitar`, {
      motivo,
    }),

  //GERENTE
  /** GET /gerentes */
  listar: () => axiosAuth.get("/gerentes"),

  /** GET /gerentes/:cpf */
  buscarPorCpf: (cpf) => axiosAuth.get(`/gerentes/${cpf}`),

  /** PUT /gerentes/:cpf */
  atualizar: (cpf, data) => axiosAuth.put(`/gerentes/${cpf}`, data),

  /** DELETE /gerentes/:cpf */
  excluir: (cpf) => axiosAuth.delete(`/gerentes/${cpf}`),

  /** GET /gerentes/:cpf/clientes */
  listarClientes: (cpf) => axiosAuth.get(`/gerentes/${cpf}/clientes`),

  // CONTA (protegido)
  /** GET /contas/por-cliente/:cpf */
  contaPorCliente: (cpf) => axiosAuth.get(`/contas/por-cliente/${cpf}`),
};
