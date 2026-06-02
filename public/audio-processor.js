class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { targetRate = 16000, actualRate = 16000 } = options.processorOptions || {};
    this.downsampleRatio = Math.round(actualRate / targetRate) || 1;
    // Pre-allocate buffer to avoid GC pressure on audio thread
    this.buffer = new Float32Array(4096);
    this.writeIndex = 0;
    this.chunkSize = 512; // ~32ms at 16kHz
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0];

    // Downsample: pick every Nth sample (e.g., 48kHz→16kHz = every 3rd)
    // When rate matches (ratio=1), processes every sample (no-op downsample)
    for (let i = 0; i < samples.length; i += this.downsampleRatio) {
      this.buffer[this.writeIndex++] = samples[i];

      if (this.writeIndex >= this.chunkSize) {
        this._flush();
      }
    }

    return true;
  }

  _flush() {
    // Float32 → Int16 PCM
    const pcm16 = new Int16Array(this.writeIndex);
    for (let i = 0; i < this.writeIndex; i++) {
      const s = Math.max(-1, Math.min(1, this.buffer[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    this.writeIndex = 0;

    // Transfer raw bytes to main thread — btoa is NOT available in
    // AudioWorkletGlobalScope on many browsers. Base64 encoding happens
    // on the main thread instead.
    const bytes = new Uint8Array(pcm16.buffer.slice(0));
    this.port.postMessage(bytes, [bytes.buffer]);
  }
}

registerProcessor('pcm-processor', PCMProcessor);
