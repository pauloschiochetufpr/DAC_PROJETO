const getTimestamp = () => {
    return new Date().toISOString();
};

const formatRequestLog = (req) => {
    return {
        timestamp: getTimestamp(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown'
    };
};

const formatResponseLog = (req, res, duration) => {
    return {
        timestamp: getTimestamp(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`
    };
};

const toLogString = (level, data) => {
    return `[${level}] ${JSON.stringify(data)}\n`;
};

module.exports = {
    formatRequestLog,
    formatResponseLog,
    toLogString
};