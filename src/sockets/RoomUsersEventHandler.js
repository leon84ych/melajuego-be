const logger = require('../config/logger');


function roomUsersEventHandler(io, socket, activeRooms) {
    /**
     * Escucha la petición de actualización y emite el estado actual a toda la sala.
     */
    socket.on('get_room_users', (payload) => {
        logger.info(`get_room_users called with payload: ${payload ? JSON.stringify(payload) : 'Empty'}`);
        
        if (!payload || typeof payload !== 'object' || !payload.roomCode) {
            socket.emit('error_message', 'Parámetros inválidos para obtener usuarios.');
            return;
        }

        const rc = payload.roomCode.trim().toUpperCase();

        // Si la sala no existe en memoria, avisamos al emisor de manera privada
        if (!activeRooms[rc]) {
            logger.warn(`[get_room_users] La sala ${rc} no existe.`);
            socket.emit('error_message', `La sala ${rc} no existe o ya ha expirado.`);
            return;
        }

        const usersInRoom = activeRooms[rc].connectedUsers || [];
        
        // Estructuramos el mensaje con el mismo formato que usa tu join_room
        let roomUpdatedMessage = {
            roomCode: rc,
            connectedUsers: usersInRoom,
            host: activeRooms[rc].host,
            totalUsers: usersInRoom.length,
            message: `Actualización de lista de usuarios solicitada.`
        };

        logger.info(`[get_room_users] Despachando room_updated a la sala ${rc}`);

        // ⚡ BROADCAST: Le llega a todos los usuarios que estén en esa sala en este momento
        io.to(rc).emit('room_updated', roomUpdatedMessage);
    });
}

module.exports = roomUsersEventHandler;