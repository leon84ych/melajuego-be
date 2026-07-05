const logger = require('../config/logger');
const broadcastAvailableRooms = require('./broadcastAvailableRooms');

function disconnectEventHandler(io, socket, activeRooms) {
    // --- NUEVO: Avisar cuando alguien se va de la sala ---
    socket.on('disconnect', () => {
        logger.info(`Usuario desconectado: ${socket.id}`);
        const rc = socket.roomCode;
        const userNickname = socket.nickname;

        // Validamos que la sala y el objeto existan antes de operar
        if (rc && activeRooms[rc]) {

            // CAMBIO AQUÍ: Apuntamos estrictamente a .connectedUsers
            activeRooms[rc].connectedUsers = activeRooms[rc].connectedUsers.filter(name => name !== userNickname);

            logger.info(`Lista actualizada tras desconexión en la sala ${rc}: ${JSON.stringify(activeRooms[rc].connectedUsers)}`);

            // Si el host/anfitrión de la partida se desconecta, abortamos el juego
            if (activeRooms[rc].host === userNickname) {
                activeRooms[rc].gameActive = false;
                activeRooms[rc].host = null;
                activeRooms[rc].activeItemIds = [];
                activeRooms[rc].startedAt = null;
                activeRooms[rc].participantResults = [];
                activeRooms[rc].batchScoresUpdatedAt = null;
                io.to(rc).emit('game_aborted', { message: 'El anfitrión abandonó la sesión de juego.' });
            }

            // Notificamos a los sobrevivientes enviando la propiedad correcta de usuarios conectados
            io.to(rc).emit('room_updated', {
                roomCode: rc,
                connectedUsers: activeRooms[rc].connectedUsers, // Corregido
                totalUsers: activeRooms[rc].connectedUsers.length, // Corregido
                message: `${userNickname || 'Un usuario'} ha abandonado la sala.`
            });

            // Si ya no queda nadie en la sala de forma absoluta, limpiamos la memoria RAM del servidor
            if (activeRooms[rc].connectedUsers.length === 0) {
                delete activeRooms[rc];
            }
        }
        broadcastAvailableRooms(io, activeRooms);
    });

}

module.exports = disconnectEventHandler;