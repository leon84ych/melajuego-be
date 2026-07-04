const logger = require('../config/logger');
const joinRoomEventHandler = require('./joinRoomEventHandler');
const startBatchEventHandler = require('./startBatchEventHandler');
const disconnectHandler = require('./disconnectEventHandler');
const submitBatchEventHandler = require('./submitBatchEventHandler');
const getBatchScoresEventHandler = require('./getBatchScoresEventHandler'); 
const getAvailableRoomsHandler = require('./getAvailableRoomsHandler');


const activeRooms = {}; 

function initSocketServer(io) {
    io.use((socket, next) => {
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
        
    });
}

module.exports = initSocketServer;