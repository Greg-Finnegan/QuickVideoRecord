let mediaRecorder;
let recordedChunks = [];

console.log('Recorder.js loaded');

// Start recording automatically when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting recording flow...');
  startRecording();
});

// Listen for stop messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Recorder received message:', message);

  if (message.action === 'stopRecording') {
    stopRecording();
    sendResponse({ success: true });
  }

  return true;
});

async function startRecording() {
  try {
    console.log('Starting recording with getDisplayMedia...');

    // Use getDisplayMedia - modern API that works without desktopCapture
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: true  // Request system audio
    });

    console.log('Got display stream:', displayStream);
    console.log('Video tracks:', displayStream.getVideoTracks());
    console.log('Audio tracks:', displayStream.getAudioTracks());

    // Get microphone audio
    console.log('Requesting microphone access...');
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    console.log('Got microphone stream:', micStream);

    // Mix audio streams
    const audioContext = new AudioContext();
    const dest = audioContext.createMediaStreamDestination();

    // Add system audio if present
    const systemAudioTracks = displayStream.getAudioTracks();
    if (systemAudioTracks.length > 0) {
      console.log('Mixing system audio with microphone');
      const systemSource = audioContext.createMediaStreamSource(
        new MediaStream(systemAudioTracks)
      );
      systemSource.connect(dest);
    } else {
      console.log('No system audio captured');
    }

    // Add microphone audio
    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(dest);

    // Combine video with mixed audio
    const finalStream = new MediaStream([
      ...displayStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    console.log('Final stream created');
    finalStream.getTracks().forEach(track => {
      console.log(`Track: ${track.kind}, label: ${track.label}`);
    });

    const video = document.getElementById('preview');
    video.srcObject = finalStream;

    recordedChunks = [];

    // Check if the codec is supported
    const mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      console.warn('VP9 not supported, falling back to VP8');
      mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
    } else {
      mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: mimeType
      });
    }

    console.log('MediaRecorder created with mimeType:', mediaRecorder.mimeType);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('Data available:', event.data.size, 'bytes');
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      console.log('Recording stopped, total chunks:', recordedChunks.length);
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      console.log('Sending download request...');
      chrome.runtime.sendMessage({
        action: 'downloadVideo',
        url: url,
        filename: `recording_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.webm`
      });

      // Close tab after download
      setTimeout(() => chrome.tabs.getCurrent(tab => chrome.tabs.remove(tab.id)), 1000);
    };

    mediaRecorder.start(1000); // Collect data every second
    console.log('MediaRecorder started!');

    // Send confirmation back to popup
    chrome.runtime.sendMessage({ action: 'recordingStarted' });

  } catch (err) {
    console.error('Recording failed - Full error:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);

    const errorMessage = `${err.name}: ${err.message}`;
    alert('Recording failed: ' + errorMessage);

    // Notify popup of error
    chrome.runtime.sendMessage({
      action: 'recordingError',
      error: errorMessage
    });
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}
