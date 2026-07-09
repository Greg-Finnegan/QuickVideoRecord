import { pipeline, env } from '@huggingface/transformers';

// Model path will be set by the offscreen document which has chrome API access
let modelPathConfigured = false;

function configureModelPath(basePath: string, ortPath?: string) {
  env.localModelPath = basePath;
  env.allowRemoteModels = false;
  env.allowLocalModels = true;

  // onnxruntime-web (transformers.js v3+) fetches its wasm backend via a
  // dynamic import(). Inside this blob-URL module worker the import would
  // resolve against the blob and fail, so point ORT at the runtime files we
  // ship under the extension origin (public/ort -> chrome-extension://<id>/ort/).
  const wasm = env.backends?.onnx?.wasm;
  if (wasm) {
    if (ortPath) {
      wasm.wasmPaths = ortPath;
    }
    // Offscreen documents are not cross-origin isolated, so SharedArrayBuffer /
    // threaded wasm is unavailable — run single-threaded to avoid a backend
    // spawn failure.
    wasm.numThreads = 1;
  }

  modelPathConfigured = true;
}

// Worker state
let transcriber: any = null;
let isLoading: boolean = false;

// Message types
interface InitializeMessage {
  action: 'initialize';
  modelPath?: string;
  ortPath?: string;
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
        // v3+ replaces the `quantized` boolean with `dtype`.
        // 'q8' resolves to the bundled `*_quantized.onnx` weights.
        dtype: 'q8',
        // ORT 1.26 tries to fuse DequantizeLinear->MatMul into its MatMulNBits
        // operator, but these q8 weights (built in the @xenova era) lack the
        // block-wise scale that fusion requires. That fusion is an extended
        // (Level-2) optimization, so cap optimization at 'basic' to skip it.
        session_options: {
          graphOptimizationLevel: 'basic',
        },
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
        const { modelPath, ortPath } = event.data as InitializeMessage;
        if (modelPath) {
          configureModelPath(modelPath, ortPath);
        }
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
