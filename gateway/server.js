const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const amqp = require("amqplib");

const app = express();

app.use(cors());
app.use(express.json());

const RABBIT_URL = "amqp://guest:guest@rabbitmq:5672";
const FILA_RESET = "saga.reset";

// Rotas que nao precisam de token (publicas)
const PUBLIC_ROUTES = [
  { path: "/auth/login",    method: "POST" },
  { path: "/auth/register", method: "POST" },
  { path: "/health",        method: "GET"  },
  { path: "/reboot",        method: "GET"  },
];

// Middleware de verificacao JWT
function authMiddleware(req, res, next) {
  const isPublic = PUBLIC_ROUTES.some(
    (route) =>
      req.path.startsWith(route.path) &&
      (route.method === req.method || route.method === "*")
  );

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token nao fornecido" });
  }

  const token = authHeader.split(" ")[1];

  fetch("http://auth-service:8080/auth/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
    .then((response) => {
      if (!response.ok) {
        return res.status(401).json({ error: "Token invalido ou expirado" });
      }
      return response.json().then((data) => {
        req.headers["x-user-id"]    = data.userId || "";
        req.headers["x-user-role"]  = data.role   || "";
        req.headers["x-user-email"] = data.email  || "";
        next();
      });
    })
    .catch((err) => {
      console.error("Erro ao validar token:", err);
      return res.status(503).json({ error: "Servico de autenticacao indisponivel" });
    });
}

app.use(authMiddleware);

// Proxies para os microsservicos
app.use(
  "/auth",
  createProxyMiddleware({
    target: "http://auth-service:8080",
    changeOrigin: true,
    logLevel: "debug",
  })
);

app.use(
  "/cliente",
  createProxyMiddleware({
    target: "http://cliente-service:8080",
    changeOrigin: true,
    logLevel: "debug",
  })
);

app.use(
  "/conta",
  createProxyMiddleware({
    target: "http://conta-service:8080",
    changeOrigin: true,
    logLevel: "debug",
  })
);

app.use(
  "/gerente",
  createProxyMiddleware({
    target: "http://gerente-service:8080",
    changeOrigin: true,
    logLevel: "debug",
  })
);

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Reboot — publica mensagem no RabbitMQ para o saga-service executar o reset geral
app.get("/reboot", async (req, res) => {
  try {
    const connection = await amqp.connect(RABBIT_URL);
    const channel    = await connection.createChannel();

    await channel.assertQueue(FILA_RESET, { durable: true });
    channel.sendToQueue(FILA_RESET, Buffer.from("reset"));

    await channel.close();
    await connection.close();

    res.status(200).send("Banco de dados criado conforme especificação");
  } catch (error) {
    console.error("Erro ao publicar no RabbitMQ:", error);
    res.status(500).send("Erro ao enviar solicitacao de reboot");
  }
});

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});