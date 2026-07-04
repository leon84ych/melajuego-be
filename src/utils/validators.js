const usernamesProhibidos = new Set([
    'admin', 'administrador', 'root', 'mod', 'moderador',
    'support', 'soporte', 'system', 'sistema', 'bot',
    'fuchile', 'test', 'prueba', 'guest', 'invitado',
    'leon84ych', 'leon', 'leon84', 'leon84y',
    // Agrega aquí los que necesites de la lista de arriba
]);

const roomCodeRegex = /^[A-Z0-9]{1,10}$/;

const nicknameRegex = /^[a-zA-Z0-9@ ]{1,15}$/;

function usernameIsValid(username) {

    const usernameLimpio = username.trim().toLowerCase();

    if (usernamesProhibidos.has(usernameLimpio)) {
        return false;
    }

    if (usernameLimpio.includes('leon84ych')) {
        return false; // Nombre rechazado
    }

    const contieneProhibido = Array.from(usernamesProhibidos).some(palabra => usernameLimpio.includes(palabra));
    if (contieneProhibido) {
        return false;
    }

    return true;
}

module.exports = {
    nicknameRegex,
    roomCodeRegex,
    usernameIsValid
};