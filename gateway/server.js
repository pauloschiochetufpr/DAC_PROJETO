const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const PUBLIC_ROUTES = [
  { path: "/auth/login",    method: "POST" },
  { path: "/auth/register", method: "POST" },
  { path: "/health",        method: "GET"  },
  { path: "/dev/reset-all", method: "POST" },
];

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

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/dev/reset-all", async (req, res) => {
  try {
    await fetch("http://cliente-service:8080/dev/reset", { method: "POST" });
    await fetch("http://gerente-service:8080/dev/reset", { method: "POST" });
    await fetch("http://conta-service:8080/dev/reset",   { method: "POST" });
    await fetch("http://auth-service:8080/dev/reset",    { method: "POST" });

    res.send("Todos os bancos foram recriados com os mocks");
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao resetar o sistema");
  }
});

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});