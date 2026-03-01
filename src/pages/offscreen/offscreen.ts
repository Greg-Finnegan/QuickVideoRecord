import { transcriptionWorkerService } from '../../utils/transcriptionWorkerService';
import { videoStorage } from '../../utils/videoStorage';
import type { TranscriptionJob, TranscriptionJobsStorage } from '../../types';

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

// Write job status directly to chrome.storage.local so it survives service worker termination.
// Also attempt to notify the background script via messaging as a best-effort fast path.
async function sendJobUpdate(
  recordingId: string,
  status: 'processing' | 'completed' | 'failed',
  progress: number,
  statusMessage: string,
  transcript?: string,
  error?: string
): Promise<void> {
  const now = Date.now();

  // 1. Write directly to storage (durable, survives worker termination)
  try {
    const result = (await chrome.storage.local.get('transcriptionJobs')) as TranscriptionJobsStorage;
    const jobs = result.transcriptionJobs || {};

    const existingJob = jobs[recordingId];
    const updatedJob: TranscriptionJob = {
      recordingId,
      status,
      progress,
      statusMessage,
      startedAt: existingJob?.startedAt || now,
      updatedAt: now,
    };
    if (transcript) updatedJob.transcript = transcript;
    if (error) updatedJob.error = error;

    jobs[recordingId] = updatedJob;
    await chrome.storage.local.set({ transcriptionJobs: jobs });
  } catch (storageError) {
    console.error('[Offscreen] Failed to write job status to storage:', storageError);
  }

  // 2. Best-effort message to background for real-time UI forwarding
  try {
    chrome.runtime.sendMessage({
      action: 'transcriptionProgress',
      recordingId,
      status: statusMessage,
      progress,
    });
  } catch {
    // Expected if background is terminated
  }

  console.log(`[Offscreen] Job update for ${recordingId}: ${status} ${progress}%`);
}

async function handleTranscribe(recordingId: string): Promise<string> {
  console.log('[Offscreen] Starting transcription for recording:', recordingId);

  try {
    // Send initial job update to background script
    sendJobUpdate(recordingId, 'processing', 0, 'Initializing transcription');

    // Get the video blob from IndexedDB (since we can't pass Blob via messages)
    const videoBlob = await videoStorage.getVideo(recordingId);
    if (!videoBlob) {
      throw new Error('Video not found in storage');
    }

    // Update status: video loaded
    sendJobUpdate(recordingId, 'processing', 5, 'Loading transcription model');

    // Perform transcription using Web Worker
    const transcript = await transcriptionWorkerService.transcribeVideo(
      videoBlob,
      (status, progress) => {
        console.log(`[Offscreen] Transcription progress: ${status} (${progress}%)`);

        // Send progress update to background script
        sendJobUpdate(recordingId, 'processing', progress, status);
      }
    );

    // Send completion update to background script
    sendJobUpdate(recordingId, 'completed', 100, 'Transcription complete', transcript);

    console.log('[Offscreen] Transcription completed successfully');
    return transcript;
  } catch (error: any) {
    console.error('[Offscreen] Transcription failed:', error);

    // Send failure update to background script
    sendJobUpdate(recordingId, 'failed', 0, 'Transcription failed', undefined, error.message || 'Unknown error');

    throw error;
  }
}
