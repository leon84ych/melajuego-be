
const logger = require('../config/logger');

const DEFAULT_RESULTS_GRACE_SECONDS = 10;
const parsedResultsGraceSeconds = Number.parseInt(process.env.RESULTS_GRACE_SECONDS, 10);
const resultsGraceSeconds = Number.isInteger(parsedResultsGraceSeconds) && parsedResultsGraceSeconds >= 0
    ? parsedResultsGraceSeconds
    : DEFAULT_RESULTS_GRACE_SECONDS;

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

        const startedAtMs = Date.parse(currentRoom.startedAt || '');
        const durationMs = Number(currentRoom.durationMinutes) * 60 * 1000;
        if (!Number.isFinite(startedAtMs) || !Number.isFinite(durationMs) || durationMs <= 0) {
            socket.emit('error_message', 'La partida no está activa en esta sala.');
            return;
        }

        const nowMs = Date.now();
        const submissionDeadlineMs = startedAtMs + durationMs + (resultsGraceSeconds * 1000);
        if (nowMs > submissionDeadlineMs) {
            socket.emit('error_message', 'La ventana para enviar resultados ya cerró.');
            return;
        }

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

        const allScoresSubmitted = Array.isArray(currentRoom.connectedUsers)
            && currentRoom.connectedUsers.length > 0
            && currentRoom.connectedUsers.every((nickname) =>
                currentRoom.participantResults.some((result) => result.nickname === nickname)
            );

        const timeFinished = Number.isFinite(startedAtMs)
            && Number.isFinite(durationMs)
            && durationMs > 0
            && nowMs >= (startedAtMs + durationMs);

        let roomGeneralScorePayload = null;
        if (allScoresSubmitted || timeFinished) {
            currentRoom.gameActive = false;

            const roomGeneralStats = currentRoom.roomGeneralStats || {};
            currentRoom.participantResults.forEach((result) => {
                const submittedAtMs = Date.parse(result.timestamp);
                const safeSubmittedAtMs = Number.isFinite(submittedAtMs) ? submittedAtMs : nowMs;
                const timeTakenMs = Math.max(0, safeSubmittedAtMs - startedAtMs);
                const effectiveTimeMs = Math.min(timeTakenMs, durationMs);
                const penaltyRate = 0.4;
                const timeFactor = 1 - Math.min(1, effectiveTimeMs / durationMs) * penaltyRate;
                const adjustedScore = Number((result.percentScore * timeFactor).toFixed(2));

                const userStats = roomGeneralStats[result.nickname] || {
                    batchCount: 0,
                    totalTimeMs: 0,
                    totalBatchTimeMs: 0,
                    accumulatedScore: 0,
                    room_general_score: null,
                    cumulativeTimeRatio: null
                };

                userStats.batchCount += 1;
                userStats.totalTimeMs += timeTakenMs;
                userStats.totalBatchTimeMs += durationMs;
                userStats.accumulatedScore += adjustedScore;
                userStats.room_general_score = Number((userStats.accumulatedScore / userStats.batchCount).toFixed(2));
                userStats.cumulativeTimeRatio = userStats.totalBatchTimeMs > 0
                    ? Number((userStats.totalTimeMs / userStats.totalBatchTimeMs).toFixed(4))
                    : null;

                roomGeneralStats[result.nickname] = userStats;
                roomGeneralScorePayload = roomGeneralStats;
            });

            currentRoom.roomGeneralStats = roomGeneralStats;
            currentRoom.room_general_score = roomGeneralScorePayload;
        }

        currentRoom.batchScoresUpdatedAt = new Date().toISOString();

        const winnerRecord = currentRoom.participantResults.reduce((best, candidate) => {
            if (!best || candidate.percentScore > best.percentScore) return candidate;
            if (candidate.percentScore === best.percentScore && candidate.correctCount > best.correctCount) return candidate;
            return best;
        }, null);

        if (allScoresSubmitted || timeFinished) {
            const payloadToSend = {
                roomCode: rc,
                participantResults: currentRoom.participantResults,
                startedAt: currentRoom.startedAt || null,
                durationMinutes: currentRoom.durationMinutes || null,
                updatedAt: currentRoom.batchScoresUpdatedAt,
                gameFinished: true,
                room_general_score: roomGeneralScorePayload
            };

            io.to(rc).emit('room_batch_scores', payloadToSend);
        }
    });
}

module.exports = submitBatchEventHandler;