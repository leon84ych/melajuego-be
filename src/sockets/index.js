const logger = require('../config/logger');
const joinRoomEventHandler = require('./RoomJoinEventHandler');
const startBatchEventHandler = require('./startBatchEventHandler');
const disconnectHandler = require('./disconnectEventHandler');
const submitBatchEventHandler = require('./submitBatchEventHandler');
const getBatchScoresEventHandler = require('./getBatchScoresEventHandler');
const getAvailableRoomsHandler = require('./getAvailableRoomsHandler');
const roomUsersEventHandler = require('./RoomUsersEventHandler');


const DEFAULT_MAX_CONNECTED_USERS = 200;
const parsedMaxConnectedUsers = Number.parseInt(process.env.MAX_CONNECTED_USERS, 10);
const maxConnectedUsers = Number.isInteger(parsedMaxConnectedUsers) && parsedMaxConnectedUsers > 0
    ? parsedMaxConnectedUsers
    : DEFAULT_MAX_CONNECTED_USERS;

const activeRooms = {};

function initSocketServer(io) {
    logger.info(`Límite máximo de usuarios conectados: ${maxConnectedUsers}`);

    io.use((socket, next) => {
        const connectedUsers = io.of('/').sockets.size;
        if (connectedUsers >= maxConnectedUsers) {
            logger.warn(`Conexión rechazada: límite máximo de usuarios alcanzado (${maxConnectedUsers}).`);
            return next(new Error('Servidor lleno. Intenta nuevamente en unos minutos.'));
        }
        return next();
        const token = socket.handshake.auth?.token;
        if (token === "BBjwBRieBjINCAIQABiABBjwBRieBjINCAMQABiABBjwBRieBjINCAQQABiABBjwBRieBjIN") {
            return next();
        }
        console.warn(`[SEGURIDAD] Conexión rechazada desde ${socket.id}. Firma de App inválida o ausente.`);
        return next(new Error("Acceso denegado: Aplicación cliente no autorizada."));
    });

    io.on('connection', (socket) => {

        logger.info(`Usuario conectado: ${socket.id}`);

        socket.on('disconnect', (reason) => {
            logger.info(`🚨 DETALLE DESCONEXIÓN ${socket.id}: Razón = ${reason}`);
        });

        joinRoomEventHandler(io, socket, activeRooms);

        startBatchEventHandler(io, socket, activeRooms);

        disconnectHandler(io, socket, activeRooms);

        submitBatchEventHandler(io, socket, activeRooms);

        getBatchScoresEventHandler(socket, activeRooms);

        getAvailableRoomsHandler(socket, activeRooms);

        roomUsersEventHandler(io, socket, activeRooms);

    });
}

module.exports = initSocketServer;