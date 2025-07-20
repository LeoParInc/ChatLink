// Generates 6 character uppercase random code
function generateCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Redirect to room.html with code param
function createRoom() {
  const code = generateCode();
  window.location.href = `/room.html?room=${code}`;
}

function joinRoom() {
  const code = document.getElementById('roomCode').value.trim().toUpperCase();
  if (!code) return alert('Enter a valid room code');
  window.location.href = `/room.html?room=${code}`;
}
