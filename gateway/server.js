const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

app.use(cors());


const SERVICE_TARGETS = {
  auth: "http://auth-service:8080",
  cliente: "http://cliente-service:8080",
  conta: "http://conta-service:8080",
  gerente: "http://gerente-service:8080",
  saga: "http://saga-service:8080",
};

function createServiceProxy(target, serviceName) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    parseReqBody: false,
    proxyTimeout: 10000,
    timeout: 10000,
    logLevel: "warn",
    onError: (err, req, res) => {
      console.error(`Erro no proxy para ${serviceName}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: `Servico ${serviceName} indisponivel`,
        });
      }
    },
  });
}

// Proxies para os microsservicos via rede interna do docker-compose.
app.use("/auth", createServiceProxy(SERVICE_TARGETS.auth, "auth-service"));
app.use(
  "/cliente",
  createServiceProxy(SERVICE_TARGETS.cliente, "cliente-service"),
);
app.use("/contas", createProxyMiddleware({
    target: SERVICE_TARGETS.conta,
    changeOrigin: true,
    xfwd: true,
    parseReqBody: false,  // ← adiciona isso
    proxyTimeout: 10000,
    timeout: 10000,
    logLevel: "warn",
    onError: (err, req, res) => {
        console.error(`Erro no proxy para conta-service:`, err.message);
        if (!res.headersSent) {
            res.status(502).json({ error: "Servico conta-service indisponivel" });
        }
    },
}));
app.use(
  "/gerente",
  createServiceProxy(SERVICE_TARGETS.gerente, "gerente-service"),
);
app.use("/saga", createServiceProxy(SERVICE_TARGETS.saga, "saga-service"));

app.use(express.json());

// Compatibilidade: /reboot no gateway aciona o saga-service via HTTP.
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
});

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});
