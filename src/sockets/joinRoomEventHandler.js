const logger = require('../config/logger');
const { roomCodeRegex, nicknameRegex, usernameIsValid } = require('../utils/validators');
const broadcastAvailableRooms = require('./broadcastAvailableRooms');

function joinRoomEventHandler(io, socket, activeRooms) {

    // 1. Un usuario crea o se une a una sala con un código (ej: "SALA-123")
    socket.on('join_room', (payload) => {
        logger.info(`join_room payload: ${payload ? JSON.stringify(payload) : 'Payload vacío'}`);
        if (!payload || typeof payload !== 'object') return;
        const { roomCode, nickname } = payload;

        if (!roomCode || typeof roomCode !== 'string' || !roomCode.trim()) return;
        if (!nickname || typeof nickname !== 'string' || !nickname.trim()) return;

        const rc = roomCode.trim().toUpperCase();
        let userNickname = nickname.trim();

        if (socket.roomCode && socket.nickname) {
            if (socket.roomCode === rc && socket.nickname === userNickname) {
                // If it is an identical double-trigger from Angular, ignore it safely
                logger.info(`[AVISO] Ignorando join_room duplicado inmediato para ${socket.id}`);
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
            socket.emit('error_message', 'El nombre de usuario contiene caracteres prohibidos.');
            return; // Bloquea la inyección y detiene el proceso
        }
        //Valida el nombre de usuario contra la lista negra de nombres prohibidos
        if (!usernameIsValid(userNickname)) {
            console.warn(`[SEGURIDAD] Nickname prohibido bloqueado desde ${socket.id}: ${userNickname}`);
            socket.emit('error_message', 'Este nombre de usuario está prohibido. Por favor, elige otro.');
            return; // Bloquea la inyección y detiene el proceso
        }
        if (!activeRooms[rc]) {
            activeRooms[rc] = {
                connectedUsers: [],
                gameActive: false,
                host: userNickname,
                activeItemIds: [],
                startedAt: null,
                participantResults: [],
                batchScoresUpdatedAt: null
            };
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


        logger.info(`Usuario ${socket.id} se unió a la sala: ${rc} (${userNickname})`);
        logger.info(`Lista actual de la sala ${rc}: ${JSON.stringify(activeRooms[rc])}`);

        io.to(rc).emit('room_updated', {
            roomCode: rc,
            connectedUsers: activeRooms[rc].connectedUsers,
            totalUsers: activeRooms[rc].connectedUsers.length,
            message: `${userNickname} se ha unido a la sala.`,
            host: activeRooms[rc].host,
            newUser: userNickname
        });

        broadcastAvailableRooms(io, activeRooms);
    });
}


module.exports = joinRoomEventHandler;