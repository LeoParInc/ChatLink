// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // serve frontend files

// In-memory rooms store
const rooms = {};

/**
 * Room structure:
 * {
 *   [roomId]: {
 *     hostId: socket.id,
 *     users: { socketId: username, ... }
 *   }
 * }
 */

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, username }) => {
    if (!roomId) {
      socket.emit('error', 'Room ID required');
      return;
    }

    // Create room if doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { hostId: socket.id, users: {} };
      console.log(`Room created: ${roomId} by ${username}`);
    }

    rooms[roomId].users[socket.id] = username || 'Guest';
    socket.join(roomId);

    // Notify this user about current users & host
    socket.emit('room-info', {
      hostId: rooms[roomId].hostId,
      users: rooms[roomId].users,
    });

    // Notify others in the room about new user
    socket.to(roomId).emit('user-joined', { id: socket.id, username });

    // Host disconnect or transfer logic
    socket.on('disconnect', () => {
      if (!rooms[roomId]) return;

      const room = rooms[roomId];
      delete room.users[socket.id];
      socket.to(roomId).emit('user-left', socket.id);

      // If host leaves
      if (socket.id === room.hostId) {
        const usersLeft = Object.keys(room.users);
        if (usersLeft.length > 0) {
          // Transfer host to first user
          room.hostId = usersLeft[0];
          io.to(roomId).emit('host-changed', room.hostId);
          console.log(`Host changed to ${room.hostId} in room ${roomId}`);
        } else {
          // No users left, delete room
          delete rooms[roomId];
          console.log(`Room deleted: ${roomId}`);
        }
      }
    });

    // Chat message handler
    socket.on('chat-msg', (msg) => {
      io.to(roomId).emit('chat-msg', { user: username, text: msg });
    });

    // WebRTC signaling handlers (offer/answer/candidate)
    socket.on('webrtc-offer', (data) => {
      socket.to(data.target).emit('webrtc-offer', {
        sdp: data.sdp,
        from: socket.id,
      });
    });

    socket.on('webrtc-answer', (data) => {
      socket.to(data.target).emit('webrtc-answer', {
        sdp: data.sdp,
        from: socket.id,
      });
    });

    socket.on('webrtc-candidate', (data) => {
      socket.to(data.target).emit('webrtc-candidate', {
        candidate: data.candidate,
        from: socket.id,
      });
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`ChatLink server running on port ${PORT}`));
