
const logger = require('../config/logger');

function getBatchScoresEventHandler(socket, activeRooms) {

    socket.on('get_room_batch_scores', (payload) => {
            logger.info(`get_room_batch_scores payload: ${payload ? JSON.stringify(payload) : 'Payload vacío'}`);

            if (!payload || typeof payload !== 'object') return;
            const { roomCode } = payload;
            if (!roomCode || typeof roomCode !== 'string' || !roomCode.trim()) return;

            const rc = roomCode.trim().toUpperCase();
            const currentRoom = activeRooms[rc];

            const participantResults = currentRoom?.participantResults || [];
            const allScoresSubmitted = Array.isArray(currentRoom?.connectedUsers)
                && currentRoom.connectedUsers.length > 0
                && currentRoom.connectedUsers.every((nickname) =>
                    participantResults.some((result) => result.nickname === nickname)
                );
            const gameFinished = Boolean(currentRoom?.startedAt) && (allScoresSubmitted || currentRoom?.gameActive === false);

            socket.emit('room_batch_scores', {
                roomCode: rc,
                participantResults,
                startedAt: currentRoom?.startedAt || null,
                updatedAt: currentRoom?.batchScoresUpdatedAt || new Date().toISOString(),
                gameFinished
            });
        });
}

module.exports = getBatchScoresEventHandler;