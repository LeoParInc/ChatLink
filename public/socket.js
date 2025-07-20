const socket = io();

function joinRoom(roomId, username) {
  socket.emit('join-room', { roomId, username });
}

socket.on('room-info', ({ hostId, users }) => {
  console.log('Room info:', hostId, users);
});

socket.on('user-joined', ({ id, username }) => {
  console.log(`${username} joined: ${id}`);
});

socket.on('user-left', (id) => {
  console.log(`User left: ${id}`);
});

socket.on('host-changed', (newHostId) => {
  console.log(`Host changed to: ${newHostId}`);
});

socket.on('chat-msg', ({ user, text }) => {
  // We'll handle chat UI later
  console.log(`[${user}]: ${text}`);
});
