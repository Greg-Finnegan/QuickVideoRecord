/**
 * Background-safe clock for the audio visualizer.
 * An AudioWorkletProcessor runs on the audio rendering thread.
 */
class AudioLevelTickerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // ~30 ticks/sec. `sampleRate` is a global in AudioWorkletGlobalScope.
    this._framesPerTick = Math.max(1, Math.round(sampleRate / 30));
    this._elapsed = 0;
  }

  process() {
    // process() is called once per render quantum (128 frames) as long as the
    // node stays connected to a destination. Meter elapsed time and ping.
    this._elapsed += 128;
    if (this._elapsed >= this._framesPerTick) {
      this._elapsed = 0;
      this.port.postMessage(0);
    }
    return true; // keep the processor alive
  }
}

registerProcessor("audio-level-ticker", AudioLevelTickerProcessor);
