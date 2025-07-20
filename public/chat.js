const chatToggleBtn = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
const closeChatBtn = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

chatToggleBtn.onclick = () => {
  chatPanel.classList.toggle('hidden');
};

closeChatBtn.onclick = () => {
  chatPanel.classList.add('hidden');
};

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    const msg = chatInput.value.trim();
    socket.emit('chat-msg', msg);
    chatInput.value = '';
    addMessage('You', msg);
  }
});

function addMessage(user, text) {
  const msgElem = document.createElement('p');
  msgElem.textContent = `${user}: ${text}`;
  chatMessages.appendChild(msgElem);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Listen for chat messages from server
socket.on('chat-msg', ({ user, text }) => {
  addMessage(user, text);
});
