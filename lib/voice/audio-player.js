export class AudioPlayer {
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.nextStartTime = 0;
  }

  _ensureContext() {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return;
    }
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.nextStartTime = 0;
  }

  addChunk(base64Data) {
    this._ensureContext();

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Ensure proper byte alignment for Int16 conversion
    const alignedLength = bytes.length - (bytes.length % 2);
    const int16 = new Int16Array(bytes.buffer, 0, alignedLength / 2);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 0x8000;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    // Schedule this buffer right after the last one, or now if we've fallen behind
    const now = this.audioContext.currentTime;
    if (this.nextStartTime < now) {
      this.nextStartTime = now;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  interrupt() {
    if (this.audioContext) {
      // Close and recreate to kill all scheduled sources
      this.audioContext.close();
      this.audioContext = null;
      this.gainNode = null;
    }
    this.nextStartTime = 0;
  }

  setVolume(level) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, level));
    }
  }

  close() {
    this.interrupt();
  }
}
