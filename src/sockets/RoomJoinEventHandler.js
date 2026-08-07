const logger = require('../config/logger');
const { roomCodeRegex, nicknameRegex, usernameIsValid } = require('../utils/validators');
const broadcastAvailableRooms = require('./broadcastAvailableRooms');

function RoomJoinEventHandler(io, socket, activeRooms) {

    // 1. Un usuario crea o se une a una sala con un código (ej: "SALA-123")
    socket.on('room_join', (payload, callback) => {
        logger.info(`room_join payload: ${payload ? JSON.stringify(payload) : 'Payload vacío'}`);
        if (!payload || typeof payload !== 'object') return;
        const { roomCode, nickname } = payload;

        if (!roomCode || typeof roomCode !== 'string' || !roomCode.trim()) return;
        if (!nickname || typeof nickname !== 'string' || !nickname.trim()) return;

        const rc = roomCode.trim().toUpperCase();
        let userNickname = nickname.trim();

        if (socket.roomCode && socket.nickname) {
            if (socket.roomCode === rc && socket.nickname === userNickname) {
                // If it is an identical double-trigger from Angular, ignore it safely
                logger.info(`[AVISO] Ignorando room_join duplicado inmediato para ${socket.id}`);
                return;
            } else {
                // If they try to change nicknames on the fly without disconnecting, kill it
                console.warn(`[SEGURIDAD] ${socket.id} intentó cambiar de nick a '${userNickname}' sin desconectarse.`);
                socket.emit('error_message', 'Ya estás registrado en una sala. Desconéctate para cambiar de perfil.');
                return;
            }
        }

        if (!roomCodeRegex.test(rc)) {
            console.warn(`[SEGURIDAD] Intento de inyección bloqueado desde ${socket.id}. Payload: ${rc}`);
            // Opcional: Enviar un evento de error privado al atacante
            socket.emit('error_message', 'Código de sala inválido o malicioso.');
            return; // Detiene la ejecución inmediatamente
        }

        if (!nicknameRegex.test(userNickname)) {
            console.warn(`[SEGURIDAD] Nickname malicioso bloqueado desde ${socket.id}: ${userNickname}`);
            // En lugar de emitir un evento 'error_message' genérico, respondes al callback de inmediato
            if (typeof callback === 'function') {
                return callback({ success: false, error: 'El nombre de usuario solo permite letras, números y @.' });
            }
            return;
        }
        //Valida el nombre de usuario contra la lista negra de nombres prohibidos
        if (!usernameIsValid(userNickname)) {
            console.warn(`[SEGURIDAD] Nickname prohibido bloqueado desde ${socket.id}: ${userNickname}`);
            if (typeof callback === 'function') {
                return callback({ success: false, error: 'Este nombre de usuario está prohibido.' });
            }
            return; // Bloquea la inyección y detiene el proceso
        }
        if (!activeRooms[rc]) {
            activeRooms[rc] = {
                connectedUsers: [],
                gameActive: false,
                host: userNickname,
                activeItemIds: [],
                startedAt: null,
                durationMinutes: null,
                participantResults: [],
                batchScoresUpdatedAt: null,
                room_general_score: null,
                roomGeneralStats: {}
            };
        } else if (!activeRooms[rc].host) {
            // Reassign host if room exists but lost its host, so connected clients get the updated UI state.
            activeRooms[rc].host = userNickname;
            logger.info(`[HOST] Sala ${rc} no tenía host; asignado ${userNickname}.`);
        }

        // Prevent duplicate names within the same room session
        if (activeRooms[rc].connectedUsers.includes(userNickname)) {
            socket.emit('error_message', 'Este nombre de usuario ya está ocupado en esta sala.');
            return;
        }

        activeRooms[rc].connectedUsers.push(userNickname);

        socket.join(rc);
        socket.roomCode = rc;
        socket.nickname = userNickname;

        if (typeof callback === 'function') {
            callback({
                success: true,
                roomCode: rc,
                nickname: userNickname,
                isHost: activeRooms[rc].host === userNickname
            });
        }

        logger.info(`room_join:success u ${userNickname} joined room ${rc}`);

        const roomUpdatedMessage = {
            roomCode: rc,
            connectedUsers: activeRooms[rc].connectedUsers,
            host: activeRooms[rc].host,
            totalUsers: activeRooms[rc].connectedUsers.length
        };

        io.to(rc).emit('room_updated', roomUpdatedMessage);

        broadcastAvailableRooms(io, activeRooms);
    });
}


module.exports = RoomJoinEventHandler;