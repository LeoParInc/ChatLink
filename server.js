const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve your frontend from 'public' folder
app.use(express.static('public'));

io.on('connection', socket => {
  console.log('a user connected:', socket.id);

  // example event handling, replace with your real logic
  socket.on('chatMessage', msg => {
    io.emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
