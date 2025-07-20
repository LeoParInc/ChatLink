let localStream;
const peers = {}; // map socketId -> RTCPeerConnection

const audioSelect = document.getElementById('audioInput');
const videoSelect = document.getElementById('videoInput');

async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = devices.filter(d => d.kind === 'audioinput');
  const videoInputs = devices.filter(d => d.kind === 'videoinput');

  audioSelect.innerHTML = '';
  videoSelect.innerHTML = '';

  audioInputs.forEach(device => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.text = device.label || `Microphone ${audioSelect.length + 1}`;
    audioSelect.appendChild(option);
  });

  videoInputs.forEach(device => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.text = device.label || `Camera ${videoSelect.length + 1}`;
    videoSelect.appendChild(option);
  });
}

async function getMediaStream() {
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  if (localStream) {
    // stop old tracks
    localStream.getTracks().forEach(t => t.stop());
  }
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined }
  });

  // Show local video
  const localVideo = document.getElementById('localVideo');
  localVideo.srcObject = localStream;

  // Replace tracks in existing peer connections
  Object.values(peers).forEach(pc => {
    const senders = pc.getSenders();
    const audioSender = senders.find(s => s.track.kind === 'audio');
    const videoSender = senders.find(s => s.track.kind === 'video');

    if (audioSender) audioSender.replaceTrack(localStream.getAudioTracks()[0]);
    if (videoSender) videoSender.replaceTrack(localStream.getVideoTracks()[0]);
  });
}

// Setup media device selects onchange
audioSelect.onchange = getMediaStream;
videoSelect.onchange = getMediaStream;

async function initLocalStream() {
  await getDevices();
  await getMediaStream();
}

initLocalStream();
