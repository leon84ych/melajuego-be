const { io } = require("socket.io-client");


const URL = "http://localhost:8080"; // Tu servidor local
//const URL = "https://melajuego-be.fly.dev"
const TOTAL_USERS = 10;
const ARRIVAL_DELAY_MS = 1000;

let connectedCount = 0;

function createClient(index) {
    const socket = io(URL, {
        forceNew: true,
        transports: ["websocket"],
        auth: {
            token: "BBjwBRieBjINCAIQABiABBjwBRieBjINCAQQABiABBjwBRieBjIN"
        }
    });

    socket.on("connect", () => {
        connectedCount++;
        console.log(`[TEST] Cliente ${index} conectado con éxito a (VIANI${index%10}) (${connectedCount}/${TOTAL_USERS})`);
        
        // Simular el ingreso a la sala de inmediato tras conectar
        socket.emit("room_join", {
            roomCode: `VIANI1`,//`VIANI${index%10}`,
            nickname: `Jugador${index}`
        });
    });

    socket.on("disconnect", () => {
        connectedCount--;
        console.log(`[TEST] Cliente ${index} se ha desconectado.`);
    });

    socket.on("connect_error", (err) => {
        console.error(`[TEST] Error en cliente ${index}:`, err.message);
    });
}

// Bucle para ir creando los 100 usuarios de forma progresiva
for (let i = 1; i <= TOTAL_USERS; i++) {
    setTimeout(() => {
        createClient(i);
    }, i * ARRIVAL_DELAY_MS);
}
