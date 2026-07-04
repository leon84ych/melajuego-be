// src/config/logger.js
function getTimestamp() {
    return !process.env.FLY_APP_NAME ? `[${new Date().toISOString()}] ` : '';
}

const logger = {
    info: (msg) => console.log(`${getTimestamp()}${msg}`),
    warn: (msg) => console.warn(`${getTimestamp()}[SEGURIDAD] ${msg}`),
    error: (msg) => console.error(`${getTimestamp()}[ERROR] ${msg}`)
};

module.exports = logger;