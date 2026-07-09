import { useEffect, useState } from "react";

export const AUDIO_LEVELS_MESSAGE = "audioLevels";

/**
 * Frequency band the visualizer responds to. This ONLY tunes what we
 * visualize — the recorded audio is untouched. Restricting the bars to the
 * speech range means low rumble (HVAC, handling thumps) and high hiss don't
 * make the bars twitch, so the visualizer tracks the actual voice.
 */
export const VOICE_BAND = {
  minHz: 200,
  maxHz: 6000,
} as const;

interface UseStreamAudioLevelsOptions {
  /** Number of frequency bars to compute. */
  barCount?: number;
  /** Frequency range (Hz) to spread the bars across. Defaults to VOICE_BAND. */
  band?: { minHz: number; maxHz: number };
  /**
   * Noise gate (0..1). Any bar quieter than this normalized level is forced to
   * 0 and the rest are rescaled, so the constant low-level hum/self-noise floor
   * (which never disappears just by narrowing the frequency band) stops
   * showing on the bars. Raise it if a resting sliver still shows.
   */
  noiseFloor?: number;
  /**
   * Mirror the spectrum around the center. Voice energy is concentrated in the
   * low frequencies, so a plain left→right spectrum piles the peak at the far
   * left. Mirroring puts the loudest (low) frequencies in the middle and tapers
   * symmetrically to both edges — a centered, balanced visualizer.
   */
  mirror?: boolean;
  /**
   * When true, throttled level updates are broadcast via
   * chrome.runtime.sendMessage so other extension contexts (e.g. the side
   * panel) can render the same visualizer.
   */
  broadcast?: boolean;
}

/**
 * Attaches an AnalyserNode to a MediaStream's audio and returns normalized
 * (0..1) frequency bar magnitudes, updated on each animation frame.
 *
 * The stream lives in whichever tab actually records; passing it here lets that
 * tab both render a visualizer locally and optionally broadcast the levels to
 * other extension pages.
 */
export const useStreamAudioLevels = (
  stream: MediaStream | null,
  {
    barCount = 35,
    band = VOICE_BAND,
    noiseFloor = 0.0,
    mirror = true,
    broadcast = true,
  }: UseStreamAudioLevelsOptions = {}
): number[] => {
  const [levels, setLevels] = useState<number[]>([]);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setLevels([]);
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    // Larger FFT = finer frequency resolution, so we can isolate the voice band
    // instead of one coarse bin smearing across it.
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.2;
    // Push the quietest signals (hum/self-noise) to 0 at the source: getByte-
    // FrequencyData maps [minDecibels, maxDecibels] → [0, 255], so raising the
    // floor from the -100 dB default means room tone reads as silence.
    analyser.minDecibels = -75;
    analyser.maxDecibels = -20;

    const source = audioContext.createMediaStreamSource(
      new MediaStream(stream.getAudioTracks())
    );
    source.connect(analyser);

    const binCount = analyser.frequencyBinCount; // fftSize / 2
    const frequencyData = new Uint8Array(binCount);

    // When mirroring we only need half a spectrum; it gets reflected to fill
    // the full bar count, so the peak lands in the center.
    const spectrumBars = mirror ? Math.ceil(barCount / 2) : barCount;

    // Map the band's Hz range onto FFT bin indices. Each bin spans
    // sampleRate / fftSize Hz, so bin = Hz / hzPerBin.
    const hzPerBin = audioContext.sampleRate / analyser.fftSize;
    const startBin = Math.max(0, Math.floor(band.minHz / hzPerBin));
    const endBin = Math.min(binCount, Math.ceil(band.maxHz / hzPerBin));
    const bandBins = Math.max(spectrumBars, endBin - startBin);
    const binsPerBar = Math.max(1, Math.floor(bandBins / spectrumBars));

    let lastBroadcast = 0;
    const BROADCAST_INTERVAL_MS = 66; // ~15fps to keep messaging cheap

    const tick = () => {
      analyser.getByteFrequencyData(frequencyData);

      // Build the (possibly half-width) spectrum: index 0 = lowest/loudest.
      const spectrum = new Array(spectrumBars);
      for (let i = 0; i < spectrumBars; i++) {
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) {
          // Only read bins inside the voice band; lows/highs are ignored.
          sum += frequencyData[startBin + i * binsPerBar + j] ?? 0;
        }
        const raw = sum / binsPerBar / 255; // normalize 0..1
        // Noise gate: subtract the floor and rescale so anything below it (the
        // constant hum/self-noise) reads as 0 while real voice keeps its range.
        spectrum[i] =
          raw <= noiseFloor ? 0 : (raw - noiseFloor) / (1 - noiseFloor);
      }

      // Fold the spectrum around the center so the loudest lows sit in the
      // middle: distance from center → spectrum index (0 at center → edges).
      const nextLevels = new Array(barCount);
      if (mirror) {
        const center = (barCount - 1) / 2;
        for (let i = 0; i < barCount; i++) {
          const idx = Math.min(spectrumBars - 1, Math.round(Math.abs(i - center)));
          nextLevels[i] = spectrum[idx];
        }
      } else {
        for (let i = 0; i < barCount; i++) nextLevels[i] = spectrum[i];
      }

      setLevels(nextLevels);

      if (broadcast) {
        const now = Date.now();
        if (now - lastBroadcast >= BROADCAST_INTERVAL_MS) {
          lastBroadcast = now;
          // Round to keep the payload small.
          const rounded = nextLevels.map((v) => Math.round(v * 100) / 100);
          chrome.runtime
            .sendMessage({ action: AUDIO_LEVELS_MESSAGE, levels: rounded })
            .catch(() => {
              /* No receiver (side panel closed) — safe to ignore. */
            });
        }
      }

    };

    // Drive the analysis from the audio thread via an AudioWorklet clock.
    let workletNode: AudioWorkletNode | null = null;
    let cancelled = false;

    // A fresh AudioContext can start suspended; resume so the audio clock (and
    // thus the worklet) actually advances.
    audioContext.resume().catch(() => {});
    audioContext.audioWorklet
      .addModule(chrome.runtime.getURL("audio-level-ticker.worklet.js"))
      .then(() => {
        if (cancelled) return;
        workletNode = new AudioWorkletNode(audioContext, "audio-level-ticker");
        // Connect to destination so the graph keeps pulling process(); the node
        // emits no audio, so nothing is heard (no double audio).
        workletNode.connect(audioContext.destination);
        workletNode.port.onmessage = tick;
      })
      .catch((err) => console.error("Audio visualizer worklet failed:", err));

    return () => {
      cancelled = true;
      if (workletNode) {
        workletNode.port.onmessage = null;
        workletNode.disconnect();
      }
      analyser.disconnect();
      source.disconnect();
      audioContext.close().catch(() => {});
      setLevels([]);
    };
  }, [stream, barCount, noiseFloor, mirror, broadcast]);

  return levels;
};
