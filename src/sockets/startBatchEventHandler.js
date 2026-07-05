
const logger = require('../config/logger');
const broadcastAvailableRooms = require('./broadcastAvailableRooms');

function startBatchEventHandler(io, socket, activeRooms) {
    // =========================================================================
    // NEW: Start Batch Multi-User Match Engine Event Handle
    // =========================================================================
    socket.on('start_batch', (payload) => {
        logger.info(`start_batch payload: ${payload ? JSON.stringify(payload) : 'Payload vacío'}`);
        // Anti-crash safety check
        if (!payload || typeof payload !== 'object') return;

        const { roomCode, itemIds } = payload;
        const rc = socket.roomCode; // Read room from the verified socket session directly

        // Security check: Verify socket is actually joined to the room it claims
        if (!rc || rc !== roomCode?.trim().toUpperCase()) {
            console.warn(`[SEGURIDAD] ${socket.id} intentó iniciar juego en una sala no autorizada: ${roomCode}`);
            return;
        }

        const currentRoom = activeRooms[rc];
        if (!currentRoom) return;

        // Constraint rule: Block overwriting a live competitive run
        if (currentRoom.gameActive) {
            socket.emit('error_message', 'Ya hay una partida activa en curso en esta sala.');
            return;
        }

        // Strict layout profile protection checks against data payload corruption
        if (!itemIds || !Array.isArray(itemIds)) {
            socket.emit('error_message', 'El mazo enviado no es válido.');
            return;
        }

        if (itemIds.length !== 10) {
            socket.emit('error_message', 'El mazo competitivo debe contener exactamente 10 elementos.');
            return;
        }

        // Validate each item ID string signature schema patterns to block deep query injection
        const idSignatureRegex = /^[a-zA-Z0-9_]{1,30}$/;
        const cleanIds = [];

        for (let id of itemIds) {
            const cleanId = String(id).trim();
            if (!idSignatureRegex.test(cleanId)) {
                console.warn(`[SEGURIDAD] Elemento ID corrupto rechazado desde ${socket.id}: ${cleanId}`);
                socket.emit('error_message', 'El mazo contiene identificadores no permitidos.');
                return;
            }
            cleanIds.push(cleanId);
        }

        // Commit state parameters to room memory database records on the server
        currentRoom.gameActive = true;
        currentRoom.host = socket.nickname; // The sender becomes the established target player to guess
        currentRoom.activeItemIds = cleanIds;
        currentRoom.startedAt = new Date().toISOString();

        logger.info(`[PARTIDA] Juego iniciado en sala ${rc} por el anfitrión: ${socket.nickname}`);

        // Broadcast the active game sequence configuration to EVERYONE inside the room lobby
        io.to(rc).emit('batch_started', {
            host: currentRoom.host,
            itemIds: currentRoom.activeItemIds,
            startedAt: currentRoom.startedAt
        });

        broadcastAvailableRooms(io, activeRooms);
    });
}

module.exports = startBatchEventHandler;