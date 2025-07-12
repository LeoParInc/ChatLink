const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {}; // roomCode => { users: Map(socket.id -> name), host: socket.id }

io.on('connection', socket => {
  let currentRoom = null;
  let userName = null;

  socket.on('createRoom', ({ hostName, roomCode }) => {
    if (rooms[roomCode]) {
      socket.emit('errorMessage', 'Room code already exists. Try another code.');
      return;
    }

    userName = hostName;
    currentRoom = roomCode;

    rooms[roomCode] = { users: new Map(), host: socket.id };
    rooms[roomCode].users.set(socket.id, userName);
    socket.join(roomCode);

    socket.emit('roomCreated', roomCode);
    io.to(roomCode).emit('systemMessage', `${userName} created the room ${roomCode}`);
    io.to(roomCode).emit('userList', Array.from(rooms[roomCode].users.values()));
  });

  socket.on('joinRoom', ({ name, roomCode }) => {
    if (!rooms[roomCode]) {
      socket.emit('errorMessage', 'Room does not exist.');
      return;
    }

    userName = name;
    currentRoom = roomCode;

    rooms[roomCode].users.set(socket.id, userName);
    socket.join(roomCode);

    io.to(roomCode).emit('systemMessage', `${userName} joined the room ${roomCode}`);
    io.to(roomCode).emit('userList', Array.from(rooms[roomCode].users.values()));

    // if no host, maybe assign new host automatically (optional)
    if (rooms[roomCode].host === null) {
      rooms[roomCode].host = socket.id;
      io.to(roomCode).emit('systemMessage', `${userName} is now the host.`);
      io.to(roomCode).emit('hostAssigned', socket.id);
    }
  });

  socket.on('chatMessage', msg => {
    if (currentRoom && userName) {
      io.to(currentRoom).emit('chatMessage', { name: userName, message: msg });
    }
  });

  // new host assignment event
  socket.on('assignNewHost', newHostId => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    if (!room) return;
    if (room.host !== null) return; // host already assigned

    if (room.users.has(newHostId)) {
      room.host = newHostId;
      io.to(currentRoom).emit('systemMessage', `${room.users.get(newHostId)} is now the host.`);
      io.to(currentRoom).emit('hostAssigned', newHostId);
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      room.users.delete(socket.id);

      io.to(currentRoom).emit('systemMessage', `${userName} left the chat.`);
      io.to(currentRoom).emit('userList', Array.from(room.users.values()));

      if (socket.id === room.host) {
        if (room.users.size === 0) {
          delete rooms[currentRoom];
        } else {
          // Ask remaining users to choose new host
          io.to(currentRoom).emit('chooseNewHost', Array.from(room.users.entries()).map(([id, name]) => ({ id, name })));
          room.host = null; // no host until reassigned
        }
      } else {
        if (room.users.size === 0) {
          delete rooms[currentRoom];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
