const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/auth",
  createProxyMiddleware({
    target: "http://auth-service:8080",
    changeOrigin: true,
    logLevel: "debug",
  }),
);

app.use(
  "/cliente",
  createProxyMiddleware({
    target: "http://cliente-service:8080",
    changeOrigin: true,
    logLevel: "debug",
  }),
);

app.use(
  "/conta",
  createProxyMiddleware({
    target: "http://conta-service:8080",
    changeOrigin: true,
    logLevel: "debug",
  }),
);

app.use(
  "/gerente",
  createProxyMiddleware({
    target: "http://gerente-service:8080",
    changeOrigin: true,
    logLevel: "debug",
  }),
);

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});

// Health endpoint para docker
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post('/dev/reset-all', async (req, res) => {

    try {

        await fetch('http://cliente-service:8080/dev/reset', { method: 'POST' });
        await fetch('http://gerente-service:8080/dev/reset', { method: 'POST' });
        await fetch('http://conta-service:8080/dev/reset', { method: 'POST' });
        await fetch('http://auth-service:8080/dev/reset', { method: 'POST' });

        res.send('Todos os bancos foram recriados com os mocks');

    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao resetar o sistema');
    }

});