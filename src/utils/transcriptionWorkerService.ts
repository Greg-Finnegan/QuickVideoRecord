// Worker response types (matching worker implementation)
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

// Service for managing transcription Web Worker
class TranscriptionWorkerService {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitializing: boolean = false;
  private progressCallback: ((status: string, progress: number) => void) | null = null;
  private transcriptionResolver: ((transcript: string) => void) | null = null;
  private transcriptionRejector: ((error: Error) => void) | null = null;

  /**
   * Initialize the worker and load the Whisper model
   */
  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    // If already initialized, return immediately
    if (this.worker && !this.isInitializing) {
      return;
    }

    // If currently initializing, wait for that to complete
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;

    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        // Create worker instance
        this.worker = new Worker(
          new URL('../workers/transcription.worker.ts', import.meta.url),
          { type: 'module' }
        );

        // Set up message listener
        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          const message = event.data;

          switch (message.type) {
            case 'initialized':
              this.isInitializing = false;
              resolve();
              break;

            case 'progress':
              if (onProgress && message.status === 'Loading AI model') {
                onProgress(message.progress);
              }
              // Also forward to active transcription progress callback
              if (this.progressCallback) {
                this.progressCallback(message.status, message.progress);
              }
              break;

            case 'complete':
              if (this.transcriptionResolver) {
                this.transcriptionResolver(message.transcript);
                this.transcriptionResolver = null;
                this.transcriptionRejector = null;
                this.progressCallback = null;
              }
              break;

            case 'error':
              const error = new Error(message.error);
              if (this.isInitializing) {
                this.isInitializing = false;
                reject(error);
              }
              if (this.transcriptionRejector) {
                this.transcriptionRejector(error);
                this.transcriptionResolver = null;
                this.transcriptionRejector = null;
                this.progressCallback = null;
              }
              break;
          }
        };

        // Set up error listener
        this.worker.onerror = (error) => {
          console.error('Worker error:', error);
          this.isInitializing = false;
          reject(new Error(`Worker error: ${error.message}`));
        };

        // Send initialize message to worker
        this.worker.postMessage({ action: 'initialize' });
      } catch (error) {
        this.isInitializing = false;
        reject(error);
      }
    });

    return this.initPromise;
  }

  /**
   * Extract audio data from video blob using Web Audio API
   * This must run in a context with DOM access (not in Worker)
   */
  private async extractAudioFromVideo(videoBlob: Blob, onProgress?: (status: string, progress: number) => void): Promise<Float32Array> {
    onProgress?.('Extracting audio from video', 35);

    // Convert blob to array buffer
    const arrayBuffer = await videoBlob.arrayBuffer();

    // Create audio context for decoding
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get mono audio data
    const audioData = audioBuffer.getChannelData(0);

    await audioContext.close();

    return audioData;
  }

  /**
   * Transcribe a video blob
   */
  async transcribeVideo(
    videoBlob: Blob,
    onProgress?: (status: string, progress: number) => void
  ): Promise<string> {
    // Step 1: Extract audio in main thread (AudioContext requires DOM)
    const audioData = await this.extractAudioFromVideo(videoBlob, onProgress);

    // Step 2: Ensure worker is initialized
    if (!this.worker) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('Failed to initialize worker');
    }

    // Store progress callback
    this.progressCallback = onProgress || null;

    // Step 3: Send audio data to worker for transcription
    return new Promise<string>((resolve, reject) => {
      this.transcriptionResolver = resolve;
      this.transcriptionRejector = reject;

      // Send transcription request to worker with extracted audio data
      this.worker!.postMessage(
        {
          action: 'transcribe',
          audioData: audioData,
        },
        // Transfer ownership of audio data buffer for performance
        [audioData.buffer]
      );
    });
  }

  /**
   * Terminate the worker and clean up resources
   */
  terminate(): void {
    if (this.worker) {
      this.worker.postMessage({ action: 'terminate' });
      this.worker.terminate();
      this.worker = null;
    }

    this.initPromise = null;
    this.isInitializing = false;
    this.progressCallback = null;
    this.transcriptionResolver = null;
    this.transcriptionRejector = null;
  }

  /**
   * Check if worker is initialized
   */
  isReady(): boolean {
    return this.worker !== null && !this.isInitializing;
  }
}

// Export singleton instance
export const transcriptionWorkerService = new TranscriptionWorkerService();
