const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const consoleContent = document.getElementById('consoleContent');

let recorderTabId = null;

// Save original console.log before overriding
const originalLog = console.log;

// Custom logger that displays in UI
function log(message, type = 'info') {
  // Use requestAnimationFrame to avoid blocking
  requestAnimationFrame(() => {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    if (type === 'error') entry.classList.add('log-error');
    if (type === 'success') entry.classList.add('log-success');

    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;

    consoleContent.appendChild(entry);
    consoleContent.scrollTop = consoleContent.scrollHeight;
  });

  // Also log to browser console using original
  originalLog.call(console, message);
}

// Override console.log for this context
console.log = function(...args) {
  const message = args.join(' ');

  // Display in UI without blocking
  requestAnimationFrame(() => {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    consoleContent.appendChild(entry);
    consoleContent.scrollTop = consoleContent.scrollHeight;
  });

  // Log to browser console using original function
  originalLog.apply(console, args);
};

recordBtn.onclick = () => {
  statusDiv.textContent = 'Opening recorder...';
  console.log('Starting capture flow...');

  // Create recorder tab - it will handle everything
  chrome.tabs.create({
    url: chrome.runtime.getURL('recorder.html'),
    active: true  // Make it active so getDisplayMedia works
  }, (createdTab) => {
    recorderTabId = createdTab.id;
    console.log('Created recorder tab:', recorderTabId);
    statusDiv.textContent = 'Recorder opened - select your screen...';
  });
};

stopBtn.onclick = async () => {
  if (!recorderTabId) return;

  try {
    await chrome.tabs.sendMessage(recorderTabId, { action: 'stopRecording' });
    recordBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    statusDiv.textContent = 'Processing download...';
  } catch (err) {
    statusDiv.textContent = 'Error stopping: ' + err.message;
  }
};

// Listen for messages from recorder and background
chrome.runtime.onMessage.addListener((msg) => {
  console.log('Popup received message: ' + JSON.stringify(msg));

  if (msg.action === 'recordingStarted') {
    recordBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    statusDiv.textContent = 'Recording in progress...';
    log('Recording confirmed started!', 'success');
  } else if (msg.action === 'recordingError') {
    statusDiv.textContent = 'Error: ' + msg.error;
    log('Recording error: ' + msg.error, 'error');
    recordBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    if (recorderTabId) {
      chrome.tabs.remove(recorderTabId);
      recorderTabId = null;
    }
  } else if (msg.action === 'downloadReady') {
    statusDiv.textContent = 'Download started!';
    log('Download ready!', 'success');
    setTimeout(() => {
      statusDiv.textContent = '';
      recordBtn.style.display = 'inline-block';
      stopBtn.style.display = 'none';
    }, 2000);
    recorderTabId = null;
  }
});
