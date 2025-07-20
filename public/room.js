const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

document.getElementById('roomId').textContent = roomId || 'Unknown';

const username = prompt('Enter your nickname') || 'Guest';

// Connect socket and join room
joinRoom(roomId, username);

const videoChat = document.getElementById('video-chat');
const remoteVideos = document.getElementById('remoteVideos');

socket.on('user-joined', async ({ id, username }) => {
  console.log(`${username} joined with id: ${id}`);
  await createPeerConnection(id, true);
});

socket.on('user-left', (id) => {
  console.log(`User left: ${id}`);
  if (peers[id]) {
    peers[id].close();
    delete peers[id];
    const videoElem = document.getElementById(`video-${id}`);
    if (videoElem) videoElem.remove();
  }
});

socket.on('webrtc-offer', async ({ sdp, from }) => {
  const pc = await createPeerConnection(from, false);
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('webrtc-answer', { sdp: pc.localDescription, target: from });
});

socket.on('webrtc-answer', async ({ sdp, from }) => {
  const pc = peers[from];
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
});

socket.on('webrtc-candidate', ({ candidate, from }) => {
  const pc = peers[from];
  if (!pc) return;
  pc.addIceCandidate(new RTCIceCandidate(candidate));
});

// Create peer connection with a new user
async function createPeerConnection(socketId, isOfferer) {
  if (peers[socketId]) return peers[socketId];

  const pc = new RTCPeerConnection();

  // Add local stream tracks to peer connection
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // Create video element for remote user
  const remoteVideo = document.createElement('video');
  remoteVideo.id = `video-${socketId}`;
  remoteVideo.autoplay = true;
  remoteVideo.playsInline = true;
  remoteVideos.appendChild(remoteVideo);

  // When remote stream arrives
  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // ICE candidate handler
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc-candidate', {
        candidate: event.candidate,
        target: socketId
      });
    }
  };

  if (isOfferer) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('webrtc-offer', { sdp: pc.localDescription, target: socketId });
  }

  peers[socketId] = pc;
  return pc;
}
