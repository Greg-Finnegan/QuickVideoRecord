import { transcriptionService } from '../../utils/transcription';
import { videoStorage } from '../../utils/videoStorage';

console.log('Offscreen document loaded for transcription');

// Listen for transcription requests from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'transcribeVideo') {
    // Immediately return true to keep the message channel open
    handleTranscribe(message.recordingId)
      .then((result) => {
        sendResponse({ success: true, transcript: result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
  return false;
});

async function handleTranscribe(recordingId: string): Promise<string> {
  console.log('Starting transcription in offscreen document for recording:', recordingId);

  try {
    // Get the video blob from IndexedDB (since we can't pass Blob via messages)
    const videoBlob = await videoStorage.getVideo(recordingId);
    if (!videoBlob) {
      throw new Error('Video not found in storage');
    }

    // Send progress update to notify background script
    chrome.runtime.sendMessage({
      action: 'transcriptionProgress',
      recordingId: recordingId,
      status: 'Starting transcription',
      progress: 0,
    });

    // Perform transcription
    const transcript = await transcriptionService.transcribeVideo(
      videoBlob,
      (status, progress) => {
        console.log(`Transcription progress: ${status} (${progress}%)`);
        // Send progress updates to background script
        chrome.runtime.sendMessage({
          action: 'transcriptionProgress',
          recordingId: recordingId,
          status: status,
          progress: progress,
        });
      }
    );

    console.log('Transcription completed successfully in offscreen document');
    return transcript;
  } catch (error) {
    console.error('Transcription failed in offscreen document:', error);
    throw error;
  }
}
