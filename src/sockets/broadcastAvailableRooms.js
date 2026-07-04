const logger = require('../config/logger');


function broadcastAvailableRooms(io, activeRooms) {
    const availableRooms = [];
    for (const rc in activeRooms) {
        // ⚡ CORRECTION: Changed .users to .connectedUsers
        if (activeRooms[rc] && activeRooms[rc].connectedUsers && !activeRooms[rc].gameActive) {
            if (activeRooms[rc].connectedUsers.length > 0) {
                availableRooms.push({
                    roomCode: rc,
                    playerCount: activeRooms[rc].connectedUsers.length,
                    // Fallback safely to the first user if a host isn't declared yet
                    host: activeRooms[rc].host || activeRooms[rc].connectedUsers[0]
                });
            }
        }
    }
    // Broadcast to absolutely all connected sockets on the server
    io.emit('available_rooms_list', availableRooms);
}

module.exports = broadcastAvailableRooms;