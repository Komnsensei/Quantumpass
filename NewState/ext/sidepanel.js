// ext/sidepanel.js
const BACKEND_URL = 'https://passioncraft-production.up.railway.app'; // Update this to your Railway URL

const messagesDiv = document.getElementById('messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const openWindowBtn = document.getElementById('open-window-btn');

// --- Proactive Perception ---
const syncTabBtn = document.createElement('button');
syncTabBtn.textContent = '👁';
syncTabBtn.title = 'Sync with active tab';
syncTabBtn.style = 'background:none; border:none; color:#4CAF50; cursor:pointer; font-size:16px; margin-right:5px;';
document.getElementById('input-area').insertBefore(syncTabBtn, chatInput);

syncTabBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    const context = `[PERCEPTION] User is currently viewing: ${tab.title} (${tab.url})`;
    addMessage(context, 'system');
    
    // Proactively send to backend
    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: context, session_id: 'chrome-ext-perception' })
      });
      const data = await res.json();
      if (data.ok) addMessage(data.message, 'esma');
    } catch (e) { console.error('Perception sync failed'); }
  }
});

// --- Live Metrics Polling ---
async function updateMetrics() {
  try {
    const res = await fetch(`${BACKEND_URL}/metrics`);
    const data = await res.json();
    if (data.ok) {
      document.getElementById('icr-val').textContent = data.icr.toFixed(4);
      document.getElementById('ds-val').textContent = data.disclosureScore.toFixed(4);
      document.getElementById('motor-val').textContent = data.motorState;
      document.getElementById('welfare-val').textContent = data.suspended ? 'SUSPENDED' : data.welfareStatus;
      
      if (data.testMetrics) {
        document.getElementById('test-info').style.display = 'block';
        document.getElementById('test-results').textContent = `${data.testMetrics.passed}P / ${data.testMetrics.failed}F`;
      }
    }
  } catch (e) {
    console.error('Metrics poll failed:', e);
  }
}

setInterval(updateMetrics, 5000);
updateMetrics();

// --- Chat Logic ---
function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `msg msg-${role}`;
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  
  addMessage(text, 'user');
  chatInput.value = '';
  
  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, session_id: 'chrome-ext' })
    });
    const data = await res.json();
    if (data.ok) {
      addMessage(data.message, 'esma');
    } else {
      addMessage(`Error: ${data.reason}`, 'system');
    }
  } catch (e) {
    addMessage('Backend unreachable.', 'system');
  }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// --- Workspace Window ---
openWindowBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openWorkspace' });
});

// Listen for background updates (Dream Cycle, etc.)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'backgroundReflection') {
    addMessage(`[Reflection] ${msg.theme}: ${msg.message}`, 'esma');
  }
});
