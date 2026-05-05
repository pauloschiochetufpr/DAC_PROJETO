const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
const logFile = path.join(logDir, "access.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const getTimestamp = () => new Date().toISOString();

const maskIp = (ip) => {
  if (!ip) return "unknown";
  return ip.replace(/\.\d+$/, ".xxx");
};

const writeLog = (message) => {
  fs.appendFile(logFile, message, (err) => {
    if (err) {
      console.error("[LOGGER ERROR]", err.message);
    }
  });
};

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  const requestLog = `[INFO] ${getTimestamp()} ${req.method} ${
    req.originalUrl
  } IP:${maskIp(req.ip)}\n`;

  console.log(requestLog.trim());
  writeLog(requestLog);

  res.on("finish", () => {
    const duration = Date.now() - start;

    const responseLog = `[INFO] ${getTimestamp()} ${req.method} ${
      req.originalUrl
    } STATUS:${res.statusCode} TIME:${duration}ms\n`;

    console.log(responseLog.trim());
    writeLog(responseLog);
  });

  next();
};

module.exports = loggerMiddleware;