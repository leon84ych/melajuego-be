
const logger = require('../config/logger');

function submitBatchEventHandler(io, socket, activeRooms) {
    // 3. Recibir resultados de batch desde el cliente
    socket.on('submit_batch_result', (payload) => {
        logger.info(`submit_batch_result payload: ${payload ? JSON.stringify(payload) : 'Payload vacío'}`);

        if (!payload || typeof payload !== 'object') return;

        const {
            id,
            roomCode,
            nickname,
            correctCount,
            incorrectCount,
            percentScore,
            totalCards,
            results,
            timestamp
        } = payload;

        if (!id || !roomCode || !nickname) return;
        const rc = roomCode.trim().toUpperCase();
        const userNickname = nickname.trim();

        if (!socket.roomCode || socket.roomCode !== rc || !socket.nickname || socket.nickname !== userNickname) {
            socket.emit('error_message', 'No estás autorizado para enviar resultados a esta sala.');
            return;
        }

        const currentRoom = activeRooms[rc];
        if (!currentRoom) return;

        if (!Array.isArray(results)) return;
        if (typeof percentScore !== 'number' || typeof correctCount !== 'number' || typeof incorrectCount !== 'number' || typeof totalCards !== 'number') return;

        const participantResult = {
            id,
            roomCode: rc,
            nickname: userNickname,
            correctCount,
            incorrectCount,
            percentScore,
            totalCards,
            results,
            timestamp: typeof timestamp === 'string' ? timestamp : new Date().toISOString()
        };

        const existingIndex = currentRoom.participantResults.findIndex(r => r.nickname === userNickname);
        if (existingIndex >= 0) {
            currentRoom.participantResults[existingIndex] = participantResult;
        } else {
            currentRoom.participantResults.push(participantResult);
        }

        currentRoom.batchScoresUpdatedAt = new Date().toISOString();

        const winnerRecord = currentRoom.participantResults.reduce((best, candidate) => {
            if (!best || candidate.percentScore > best.percentScore) return candidate;
            if (candidate.percentScore === best.percentScore && candidate.correctCount > best.correctCount) return candidate;
            return best;
        }, null);

        const winner = winnerRecord ? winnerRecord.nickname : undefined;

        const payloadToSend = {
            roomCode: rc,
            participantResults: currentRoom.participantResults,
            winner,
            updatedAt: currentRoom.batchScoresUpdatedAt
        };

        io.to(rc).emit('room_batch_scores', payloadToSend);
    });
}

module.exports = submitBatchEventHandler;