const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const crypto = require("crypto");
// jose
const { jwtDecrypt } = require("jose");

const app = express();

// JWT_SECRET deve ser idêntico ao jwt.secret do auth-service/application.yml
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error(
    "FATAL: JWT_SECRET não definido. Configure a variável de ambiente.",
  );
  process.exit(1);
}

// Targets dos microsserviços na rede interna do docker-compose
const SERVICE_TARGETS = {
  auth: "http://auth-service:8080",
  cliente: "http://cliente-service:8080",
  conta: "http://conta-service:8080",
  gerente: "http://gerente-service:8080",
  saga: "http://saga-service:8080",
};

// validateJwt | valida JWT criptografado (JWE) com algoritmo DIR e A256GCM
async function validateJwt(token) {
  // Deriva a chave de 256 bits (32 bytes) usando SHA-256 de forma idêntica ao Java
  const key = crypto.createHash("sha256").update(JWT_SECRET).digest();
  const { payload } = await jwtDecrypt(token, key, {
    contentEncryptionAlgorithms: ["A256GCM"],
    keyManagementAlgorithms: ["dir"]
  });
  return payload;
}

// createServiceProxy | cria proxy para um microsserviço com configuração padrão
function createServiceProxy(target, serviceName, extraOpts = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: 10000,
    timeout: 10000,
    ...extraOpts,
    onError: (err, req, res) => {
      console.error(`Erro no proxy para ${serviceName}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: `Servico ${serviceName} indisponivel` });
      }
    },
  });
}

// Rotas abertas — não exigem token
const OPEN_ROUTES = [
  { method: "POST", path: /^\/auth\/login$/ },
  { method: "POST", path: /^\/auth\/logout$/ },
  { method: "POST", path: /^\/auth\/refresh$/ },
  { method: "POST", path: /^\/login$/ },
  { method: "POST", path: /^\/logout$/ },
  { method: "POST", path: /^\/refresh$/ },
  { method: "POST", path: /^\/clientes$/ },
  { method: "GET", path: /^\/health$/ },
  { method: "GET", path: /^\/reboot$/ },
  { method: "POST", path: /^\/reboot$/ },
];

// Rotas internas — bloqueadas externamente
const BLOCKED_ROUTES = [{ method: "POST", path: /^\/auth\/validate$/ }];

// Regras de acesso por role — primeiro match vence
// Rotas autenticadas sem regra são acessíveis por qualquer usuário logado
const ROLE_RULES = [
  // Clientes
  { method: "GET", path: /^\/clientes$/, roles: ["gerente", "administrador"] },
  {
    method: "GET",
    path: /^\/clientes\/[^/]+$/,
    roles: ["cliente", "gerente", "administrador"],
  },
  {
    method: "PUT",
    path: /^\/clientes\/[^/]+$/,
    roles: ["cliente", "gerente", "administrador"],
  },
  { method: "POST", path: /^\/clientes\/[^/]+\/aprovar$/, roles: ["gerente"] },
  { method: "POST", path: /^\/clientes\/[^/]+\/rejeitar$/, roles: ["gerente"] },

  // Contas
  {
    method: "GET",
    path: /^\/contas\/[^/]+\/saldo$/,
    roles: ["cliente", "gerente", "administrador"],
  },
  { method: "POST", path: /^\/contas\/[^/]+\/depositar$/, roles: ["cliente"] },
  { method: "POST", path: /^\/contas\/[^/]+\/sacar$/, roles: ["cliente"] },
  { method: "POST", path: /^\/contas\/[^/]+\/transferir$/, roles: ["cliente"] },
  { method: "GET", path: /^\/contas\/[^/]+\/extrato$/, roles: ["cliente"] },

  // Gerentes
  { method: "GET", path: /^\/gerentes$/, roles: ["administrador"] },
  { method: "POST", path: /^\/gerentes$/, roles: ["administrador"] },
  { method: "GET", path: /^\/gerentes\/[^/]+$/, roles: ["administrador"] },
  { method: "DELETE", path: /^\/gerentes\/[^/]+$/, roles: ["administrador"] },
  { method: "PUT", path: /^\/gerentes\/[^/]+$/, roles: ["administrador"] },
];

// authenticate | valida token JWT e aplica controle de acesso antes de encaminhar
async function authenticate(req, res, next) {
  const { method, path } = req;

  // Bloqueia rotas internas
  if (BLOCKED_ROUTES.some((r) => r.method === method && r.path.test(path))) {
    return res.status(404).json({ error: "Rota não encontrada" });
  }

  // Rotas abertas passam diretamente
  if (OPEN_ROUTES.some((r) => r.method === method && r.path.test(path))) {
    delete req.headers["x-forwarded-for"];
    return next();
  }

  // Rota não mapeada em nenhuma regra conhecida
  if (!ROLE_RULES.some((r) => r.method === method && r.path.test(path))) {
    return res.status(404).json({ error: "Rota não encontrada" });
  }

  // Exige Bearer token
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente" });
  }

  const token = authHeader.substring(7);

  let payload;
  try {
    payload = await validateJwt(token);
  } catch (err) {
    if (err.code === "ERR_JWT_EXPIRED" || err.name === "JWTExpired") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }

  // Aplica regras de role para rotas restritas
  const role = (payload.role || "").toLowerCase();
  const rule = ROLE_RULES.find((r) => r.method === method && r.path.test(path));
  if (rule && !rule.roles.includes(role)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  // Propaga identidade do usuário para os microsserviços downstream
  req.headers["x-user-cpf"] = payload.sub;
  req.headers["x-user-role"] = role;
  req.headers["x-user-email"] = payload.email;

  // Remove X-Forwarded-For do cliente para que xfwd:true injete apenas o IP real do socket
  delete req.headers["x-forwarded-for"];

  next();
}

// CORS_ORIGIN | origem permitida para credenciais (frontend em dev)
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(authenticate);

// Proxies para os microsserviços via rede interna do docker-compose
// pathRewrite recoloca o prefixo que o Express strip ao montar com app.use("/prefix")
app.use(
  "/auth",
  createServiceProxy(SERVICE_TARGETS.auth, "auth-service", {
    pathRewrite: {
      "^/(\\?.*)?$": "/auth$1",
      "^/([^?]+)(\\?.*)?$": "/auth/$1$2",
    },
  }),
);
app.use(
  "/login",
  createServiceProxy(SERVICE_TARGETS.auth, "auth-service", {
    pathRewrite: {
      "^.*$": "/auth/login",
    },
  }),
);
app.use(
  "/logout",
  createServiceProxy(SERVICE_TARGETS.auth, "auth-service", {
    pathRewrite: {
      "^.*$": "/auth/logout",
    },
  }),
);
app.use(
  "/refresh",
  createServiceProxy(SERVICE_TARGETS.auth, "auth-service", {
    pathRewrite: {
      "^.*$": "/auth/refresh",
    },
  }),
);
app.use(
  "/clientes",
  createServiceProxy(SERVICE_TARGETS.cliente, "cliente-service", {
    pathRewrite: {
      "^/(\\?.*)?$": "/clientes$1",
      "^/([^?]+)(\\?.*)?$": "/clientes/$1$2",
    },
  }),
);
app.use(
  "/contas",
  createServiceProxy(SERVICE_TARGETS.conta, "conta-service", {
    pathRewrite: {
      "^/(\\?.*)?$": "/contas$1",
      "^/([^?]+)(\\?.*)?$": "/contas/$1$2",
    },
  }),
);
app.use(
  "/gerentes",
  createServiceProxy(SERVICE_TARGETS.gerente, "gerente-service", {
    pathRewrite: {
      "^/(\\?.*)?$": "/gerentes$1",
      "^/([^?]+)(\\?.*)?$": "/gerentes/$1$2",
    },
  }),
);
app.use(
  "/saga",
  createServiceProxy(SERVICE_TARGETS.saga, "saga-service", {
    pathRewrite: {
      "^/(\\?.*)?$": "/saga$1",
      "^/([^?]+)(\\?.*)?$": "/saga/$1$2",
    },
  }),
);

app.use(express.json());

// reboot | encaminha ao saga-service
app.all(
  "/reboot",
  createProxyMiddleware({
    target: SERVICE_TARGETS.saga,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { "^/reboot": "/reboot" },
    logLevel: "warn",
  }),
);

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});