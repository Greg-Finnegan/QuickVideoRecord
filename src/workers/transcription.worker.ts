import { pipeline } from '@xenova/transformers';

// Worker state
let transcriber: any = null;
let isLoading: boolean = false;

// Message types
interface InitializeMessage {
  action: 'initialize';
}

interface TranscribeMessage {
  action: 'transcribe';
  audioData: Float32Array;
}

interface TerminateMessage {
  action: 'terminate';
}

type WorkerMessage = InitializeMessage | TranscribeMessage | TerminateMessage;

// Response types
interface ProgressResponse {
  type: 'progress';
  status: string;
  progress: number;
}

interface CompleteResponse {
  type: 'complete';
  transcript: string;
}

interface ErrorResponse {
  type: 'error';
  error: string;
}

interface InitializedResponse {
  type: 'initialized';
}

type WorkerResponse = ProgressResponse | CompleteResponse | ErrorResponse | InitializedResponse;

// Post message helper with proper typing
function postMessage(message: WorkerResponse): void {
  self.postMessage(message);
}

// Initialize the Whisper model
async function initializeModel(): Promise<void> {
  if (transcriber) {
    postMessage({ type: 'initialized' });
    return;
  }

  if (isLoading) {
    return;
  }

  isLoading = true;
  postMessage({ type: 'progress', status: 'Loading AI model', progress: 0 });

  try {
    transcriber = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en',
      {
        quantized: true,
        progress_callback: (progress: any) => {
          if (progress.progress !== undefined) {
            const progressPercent = Math.round(progress.progress);
            postMessage({
              type: 'progress',
              status: 'Loading AI model',
              progress: Math.min(progressPercent, 30), // Cap at 30% for model loading
            });
          }
        },
      }
    );

    console.log('Whisper model loaded successfully in worker');
    postMessage({ type: 'initialized' });
  } catch (error) {
    console.error('Failed to load Whisper model in worker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    postMessage({ type: 'error', error: `Failed to load model: ${errorMessage}` });
    throw error;
  } finally {
    isLoading = false;
  }
}

// Transcribe audio data
async function transcribeAudio(audioData: Float32Array): Promise<string> {
  if (!transcriber) {
    await initializeModel();
  }

  postMessage({ type: 'progress', status: 'Transcribing audio', progress: 50 });

  try {
    console.log('Starting transcription in worker...');

    const result = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
    });

    const transcript = result.text.trim();
    console.log('Transcription complete in worker:', transcript);

    return transcript;
  } catch (error) {
    console.error('Transcription failed in worker:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Transcription failed: ${errorMessage}`);
  }
}

// Handle transcribe message
async function handleTranscribe(audioData: Float32Array): Promise<void> {
  try {
    // Step 1: Initialize model if needed
    if (!transcriber) {
      await initializeModel();
    }

    // Step 2: Transcribe
    const transcript = await transcribeAudio(audioData);

    // Step 3: Send completion
    postMessage({
      type: 'progress',
      status: 'Complete!',
      progress: 100,
    });

    postMessage({
      type: 'complete',
      transcript,
    });
  } catch (error) {
    console.error('Error in handleTranscribe:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    postMessage({
      type: 'error',
      error: errorMessage,
    });
  }
}

// Main message listener
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { action } = event.data;

  try {
    switch (action) {
      case 'initialize':
        await initializeModel();
        break;

      case 'transcribe':
        const { audioData } = event.data as TranscribeMessage;
        await handleTranscribe(audioData);
        break;

      case 'terminate':
        // Clean up resources
        transcriber = null;
        self.close();
        break;

      default:
        console.warn('Unknown action in worker:', action);
    }
  } catch (error) {
    console.error('Error in worker message handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    postMessage({
      type: 'error',
      error: errorMessage,
    });
  }
});

// Export empty object to make TypeScript happy
export {};
