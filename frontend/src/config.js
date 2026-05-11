import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

//  Instância pública
const axiosPublic = axios.create({ baseURL: BASE_URL });

//  Instância protegida
const axiosAuth = axios.create({ baseURL: BASE_URL });

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

  //  CLIENTE (protegido)
  /** GET /clientes/:cpf */
  buscarClientePorCpf: (cpf) => axiosAuth.get(`/clientes/${cpf}`),

  /** GET /clientes */
  listarClientes: () => axiosAuth.get("/clientes"),

  /** GET /clientes requestParams */
  listarClientesComParametro: (params) =>
    axiosAuth.get("/clientes", { params }),

  /** PUT /clientes/:cpf/aprovar */
  aprovarCliente: (cpf) => axiosAuth.put(`/clientes/${cpf}/aprovar`),

  /** PUT /clientes/:cpf/rejeitar */
  rejeitarCliente: (cpf) => axiosAuth.put(`/clientes/${cpf}/rejeitar`),

  //  GERENTE (protegido)
  /** GET /gerentes */
  listarGerentes: () => axiosAuth.get("/gerentes"),

  /** GET /gerentes/:cpf */
  buscarGerentePorCpf: (cpf) => axiosAuth.get(`/gerentes/${cpf}`),

  /** PUT /gerentes/:cpf */
  atualizarGerente: (cpf, data) => axiosAuth.put(`/gerentes/${cpf}`, data),

  /** DELETE /gerentes/:cpf */
  excluirGerente: (cpf) => axiosAuth.delete(`/gerentes/${cpf}`),

  // CONTA do CLIENTE (protegido)
  /** GET /:numero/saldo */
  consultarSaldo: (numero) => axiosAuth.get(`/${numero}/saldo`),

  /** POST /:numero/depositar RequestBody */
  depositar: (numero, valor) =>
    axiosAuth.post(`/${numero}/depositar`, { valor }),

  /** POST /:numero/sacar RequestBody */
  sacar: (numero, valor) => axiosAuth.post(`/${numero}/sacar`, { valor }),

  /** POST /:numero/transferir RequestBody */
  transferir: (numero, valor, destino) =>
    axiosAuth.post(`/${numero}/transferir`, { valor, destino }),

  /** // GET /:numero/extrato */
  consultarExtrato: (numero, dataInicio, dataFim) => {
    const params = {};
    if (dataInicio) params.dataInicio = dataInicio;
    if (dataFim) params.dataFim = dataFim;
    return axiosAuth.get(`/${numero}/extrato`, { params });
  },

  // CONTA (protegido)
  /** GET /por-cliente/:cpf */
  contaPorCliente: (cpf) => axiosAuth.get(`/por-cliente/${cpf}`),
};
