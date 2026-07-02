const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configuramos CORS para permitir que tu app de Angular (local o GitHub Pages) se conecte
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, reemplaza por tu URL de GitHub Pages
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);

  // 1. Un usuario crea o se une a una sala con un código (ej: "SALA-123")
  socket.on('join_room', (roomCode) => {
    socket.join(roomCode);
    console.log(`Usuario ${socket.id} se unió a la sala: ${roomCode}`);
  });

  // 2. Escucha cuando un usuario desliza una tarjeta y se lo transmite al rival
  socket.on('send_swipe', (data) => {
    // data = { roomCode, cardId, action, username }
    socket.to(data.roomCode).emit('receive_swipe', data);
  });

  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log('Servidor WebSocket corriendo en http://localhost:3000');
});
