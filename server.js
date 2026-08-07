const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const initSocketServer = require('./src/sockets/index');
const logger = require('./src/config/logger');
const app = express();

// Simple health check endpoint for Fly.io proxy validation
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

const server = http.createServer(app);

// Configuramos CORS para permitir que tu app de Angular (local o GitHub Pages) se conecte
const io = new Server(server, {
    cors: {
        origin: [
             "http://localhost:4200",
             "https://leon84ych.github.io",
             "https://fuchile.netlify.app"
        ],
        methods: ["GET", "POST"]
    }
});

// Inicializar la arquitectura modular de sockets
initSocketServer(io);

const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Servidor WebSocket corriendo en el puerto ${PORT}`);
});







