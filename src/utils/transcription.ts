import { pipeline } from '@xenova/transformers';

class TranscriptionService {
  private transcriber: any = null;
  private isLoading: boolean = false;

  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.transcriber) return;
    if (this.isLoading) return;

    this.isLoading = true;

    try {
      // Use Whisper tiny model for faster processing
      // Options: 'Xenova/whisper-tiny.en', 'Xenova/whisper-base.en', 'Xenova/whisper-small.en'
      this.transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en',
        {
          quantized: true, // Use quantized version for smaller size
          progress_callback: (progress: any) => {
            if (onProgress && progress.progress !== undefined) {
              onProgress(Math.round(progress.progress));
            }
          },
        }
      );
      console.log('Whisper model loaded successfully');
    } catch (error) {
      console.error('Failed to load Whisper model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async transcribe(
    audioBlob: Blob,
    onProgress?: (text: string, progress: number) => void
  ): Promise<string> {
    if (!this.transcriber) {
      await this.initialize();
    }

    try {
      // Convert blob to audio data
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Get audio data (mono channel)
      const audioData = audioBuffer.getChannelData(0);

      console.log('Starting transcription...');

      // Transcribe
      const result = await this.transcriber(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      });

      const transcript = result.text.trim();
      console.log('Transcription complete:', transcript);

      return transcript;
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }

  async extractAudioFromVideo(videoBlob: Blob): Promise<Blob> {
    // Create a video element to extract audio
    const video = document.createElement('video');
    const audioContext = new AudioContext();

    return new Promise((resolve, reject) => {
      video.src = URL.createObjectURL(videoBlob);

      video.addEventListener('loadedmetadata', async () => {
        try {
          const source = audioContext.createMediaElementSource(video);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);

          const mediaRecorder = new MediaRecorder(destination.stream);
          const audioChunks: Blob[] = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            URL.revokeObjectURL(video.src);
            resolve(audioBlob);
          };

          mediaRecorder.start();
          video.play();

          video.addEventListener('ended', () => {
            mediaRecorder.stop();
            video.pause();
          });
        } catch (error) {
          URL.revokeObjectURL(video.src);
          reject(error);
        }
      });

      video.addEventListener('error', () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      });
    });
  }

  async transcribeVideo(
    videoBlob: Blob,
    onProgress?: (status: string, progress: number) => void
  ): Promise<string> {
    try {
      onProgress?.('Extracting audio from video...', 10);

      // For WebM videos, we can directly use the blob as it contains audio
      // If extraction is needed, we'd use extractAudioFromVideo()

      onProgress?.('Loading AI model...', 30);
      await this.initialize();

      onProgress?.('Transcribing audio...', 50);
      const transcript = await this.transcribe(videoBlob);

      onProgress?.('Complete!', 100);
      return transcript;
    } catch (error) {
      console.error('Video transcription failed:', error);
      throw error;
    }
  }
}

export const transcriptionService = new TranscriptionService();
