import { transcriptionWorkerService } from '../../utils/transcriptionWorkerService';
import { videoStorage } from '../../utils/videoStorage';

console.log('Offscreen document loaded for transcription');

// Listen for transcription requests from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'transcribeVideo') {
    // Send immediate optimistic response to prevent channel timeout (MV3 service worker will terminate)
    sendResponse({ success: true, started: true });

    // Continue transcription in background (fire-and-forget)
    handleTranscribe(message.recordingId).catch((error) => {
      console.error('[Offscreen] Background transcription failed:', error);
    });

    return false;
  }
  return false;
});

// Send a message to the background script. chrome.runtime.sendMessage from the
// offscreen document will wake the service worker if it's terminated, so the
// background is guaranteed to be alive to handle the message.
function sendToBackground(payload: Record<string, unknown>): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Offscreen] sendToBackground error:', chrome.runtime.lastError.message);
        resolve(undefined);
      } else {
        resolve(response);
      }
    });
  });
}

// Fire-and-forget progress notification. Does not wait for a response
// (the background handler returns false / no response for these).
function sendProgress(recordingId: string, statusMessage: string, progress: number): void {
  try {
    chrome.runtime.sendMessage({
      action: 'transcriptionProgress',
      recordingId,
      status: statusMessage,
      progress,
    });
  } catch {
    // Background may be terminated — harmless
  }
}

async function handleTranscribe(recordingId: string): Promise<string> {
  console.log('[Offscreen] Starting transcription for recording:', recordingId);

  try {
    sendProgress(recordingId, 'Initializing transcription', 0);

    // Get the video blob from IndexedDB (since we can't pass Blob via messages)
    const videoBlob = await videoStorage.getVideo(recordingId);
    if (!videoBlob) {
      throw new Error('Video not found in storage');
    }

    sendProgress(recordingId, 'Loading transcription model', 5);

    // Perform transcription using Web Worker
    const transcript = await transcriptionWorkerService.transcribeVideo(
      videoBlob,
      (status, progress) => {
        console.log(`[Offscreen] Transcription progress: ${status} (${progress}%)`);
        sendProgress(recordingId, status, progress);
      }
    );

    console.log('[Offscreen] Transcription completed, saving transcript...');

    // Send transcript to background for persistence. This wakes the service
    // worker if needed and waits for acknowledgement.
    const saveResult = await sendToBackground({
      action: 'saveTranscript',
      recordingId,
      transcript,
    });

    if (saveResult?.success) {
      console.log('[Offscreen] Transcript saved successfully:', recordingId);
    } else {
      console.error('[Offscreen] Background failed to save transcript:', saveResult?.error);
    }

    // Clean up worker to prevent ONNX thread errors after transcription
    transcriptionWorkerService.terminate();

    // Ask background to close this offscreen document now that we're done
    await sendToBackground({ action: 'closeOffscreen' });

    return transcript;
  } catch (error: any) {
    console.error('[Offscreen] Transcription failed:', error);

    transcriptionWorkerService.terminate();

    // Tell background to clear the transcribing flag
    await sendToBackground({
      action: 'transcriptionFailed',
      recordingId,
      error: error.message || 'Unknown error',
    });

    await sendToBackground({ action: 'closeOffscreen' });

    throw error;
  }
}
