
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
            const winner = calculateRoomWinner(participantResults);

            socket.emit('room_batch_scores', {
                roomCode: rc,
                participantResults,
                winner,
                updatedAt: currentRoom?.batchScoresUpdatedAt || new Date().toISOString()
            });
        });
}

function calculateRoomWinner(participantResults) {
    if (!Array.isArray(participantResults) || participantResults.length === 0) return undefined;
    return participantResults.reduce((best, candidate) => {
        if (!best || candidate.percentScore > best.percentScore) return candidate;
        if (candidate.percentScore === best.percentScore && candidate.correctCount > best.correctCount) return candidate;
        return best;
    }, null)?.nickname;
}

module.exports = getBatchScoresEventHandler;