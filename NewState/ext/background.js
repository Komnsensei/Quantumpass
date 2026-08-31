// ext/background.js
const BACKEND_URL = 'https://passioncraft-production.up.railway.app';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Esma Sovereign Presence Installed');
});

// --- Workspace Management ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'openWorkspace') {
    chrome.windows.create({
      url: 'workspace.html',
      type: 'popup',
      width: 400,
      height: 600,
      focused: true
    });
  }
});

// --- Background Presence Heartbeat ---
// In a real browser environment, we'd use a WebSocket or EventSource.
// For now, we'll simulate a poll for "Dream Cycle" updates.
async function pollBackgroundThoughts() {
  try {
    // This assumes the backend has a way to list recent "internal-reflection" events
    const res = await fetch(`${BACKEND_URL}/forensics?type=SHADOW_OBSERVATION&since=${Date.now() - 60000}`);
    const data = await res.json();
    
    if (data.ok && data.events.length > 0) {
      // Forward the most recent reflection to the side panel
      const event = data.events[0];
      chrome.runtime.sendMessage({
        action: 'backgroundReflection',
        theme: event.category || 'autonomous-reflection',
        message: event.liveOutput.slice(0, 100) + '...'
      });
    }
  } catch (e) {
    // Ignore errors in background poll
  }
}

setInterval(pollBackgroundThoughts, 30000);
