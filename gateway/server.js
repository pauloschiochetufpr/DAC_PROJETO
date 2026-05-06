const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
// jose
const { jwtDecrypt } = require("jose");
// node built-in
const { createHash } = require("crypto");

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

// deriveKey | deriva chave AES-256 (32 bytes) via SHA-256, espelhando JwtService.java
function deriveKey() {
  return createHash("sha256").update(JWT_SECRET, "utf8").digest();
}

// validateJwe | decifra e valida o JWE; lança ERR_JWT_EXPIRED se expirado
async function validateJwe(token) {
  const { payload } = await jwtDecrypt(token, deriveKey());
  return payload;
}

// createServiceProxy | cria proxy para um microsserviço com configuração padrão
function createServiceProxy(target, serviceName, extraOpts = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    parseReqBody: false,
    proxyTimeout: 10000,
    timeout: 10000,
    logLevel: "warn",
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
  { method: "POST", path: /^\/clientes$/ },
  { method: "GET", path: /^\/health$/ },
  { method: "GET", path: /^\/reboot$/ },
];

// Rotas internas — bloqueadas externamente
const BLOCKED_ROUTES = [{ method: "POST", path: /^\/auth\/validate$/ }];

// Regras de acesso por role — primeiro match vence
// Rotas autenticadas sem regra são acessíveis por qualquer usuário logado
const ROLE_RULES = [
  {
    method: "GET",
    path: /^\/gerentes(\/.*)?$/,
    roles: ["gerente", "administrador"],
  },
  { method: "POST", path: /^\/gerentes$/, roles: ["administrador"] },
  { method: "PUT", path: /^\/gerentes\/.+/, roles: ["administrador"] },
  { method: "DELETE", path: /^\/gerentes\/.+/, roles: ["administrador"] },
  { method: "GET", path: /^\/clientes$/, roles: ["gerente", "administrador"] },
  {
    method: "POST",
    path: /^\/clientes\/[^/]+\/aprovar$/,
    roles: ["gerente", "administrador"],
  },
  {
    method: "POST",
    path: /^\/clientes\/[^/]+\/rejeitar$/,
    roles: ["gerente", "administrador"],
  },
  { method: "POST", path: /^\/reboot$/, roles: ["administrador"] },
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
    return next();
  }

  // Exige Bearer token
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente" });
  }

  const token = authHeader.substring(7);

  let payload;
  try {
    payload = await validateJwe(token);
  } catch (err) {
    if (err.code === "ERR_JWT_EXPIRED") {
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

  next();
}

app.use(cors());
app.use(authenticate);

// Proxies para os microsserviços via rede interna do docker-compose
app.use("/auth", createServiceProxy(SERVICE_TARGETS.auth, "auth-service"));
app.use(
  "/clientes",
  createServiceProxy(SERVICE_TARGETS.cliente, "cliente-service"),
);
app.use("/contas", createServiceProxy(SERVICE_TARGETS.conta, "conta-service"));
app.use(
  "/gerentes",
  createServiceProxy(SERVICE_TARGETS.gerente, "gerente-service"),
);
app.use("/saga", createServiceProxy(SERVICE_TARGETS.saga, "saga-service"));

app.use(express.json());

// reboot | encaminha ao saga-service
app.post(
  "/reboot",
  createProxyMiddleware({
    target: SERVICE_TARGETS.saga,
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { "^/reboot": "/reboot" },
    logLevel: "warn",
  }),
);

app.get("/reboot", (req, res) => {
  res.status(405).json({
    error: "Use POST /reboot para executar o reset orquestrado",
  });
  s;
});

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});
