const logger = require('../config/logger');
const broadcastAvailableRooms = require('./broadcastAvailableRooms');

function getAvailableRoomsHandler(socket, activeRooms) {
    // 4. Send the list of joinable rooms to the requesting client
    socket.on('get_available_rooms', () => {
        logger.info(`get_available_rooms called`);

        const availableRooms = [];

        for (const rc in activeRooms) {
            if (activeRooms[rc] && activeRooms[rc].connectedUsers && !activeRooms[rc].gameActive) {
                if (activeRooms[rc].connectedUsers.length > 0) {
                    availableRooms.push({
                        roomCode: rc,
                        playerCount: activeRooms[rc].connectedUsers.length,
                        host: activeRooms[rc].host || activeRooms[rc].connectedUsers[0]
                    });
                }
            }
        }

        socket.emit('available_rooms_list', availableRooms);
    });
}

module.exports = getAvailableRoomsHandler;