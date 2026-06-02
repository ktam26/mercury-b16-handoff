export class AudioStreamer {
  constructor() {
    this.stream = null;
    this.audioContext = null;
    this.source = null;
    this.workletNode = null;
    this.silentGain = null;
    this.onData = null;
    this._muted = false;
  }

  async start() {
    // Create and resume AudioContext FIRST, before any async operations.
    // iOS Safari requires AudioContext to be created in the user gesture
    // call stack. If we await getUserMedia first, the gesture context is lost
    // and the AudioContext stays suspended (process() never called).
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const resumePromise = this.audioContext.state === 'suspended'
      ? this.audioContext.resume()
      : Promise.resolve();

    // Start getUserMedia and AudioContext resume in parallel
    let stream;
    try {
      [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }),
        resumePromise,
      ]);
    } catch (err) {
      this.audioContext.close();
      this.audioContext = null;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Microphone access denied. Please allow mic access and try again.');
      }
      if (err.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone.');
      }
      throw new Error('Could not access microphone: ' + err.message);
    }
    this.stream = stream;

    // Detect actual sample rate — some browsers (Safari) ignore the requested rate
    const actualRate = this.audioContext.sampleRate;

    await this.audioContext.audioWorklet.addModule('/audio-processor.js');

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor', {
      processorOptions: { targetRate: 16000, actualRate },
    });

    this.workletNode.port.onmessage = (event) => {
      if (this.onData && !this._muted) {
        // Worklet sends raw Uint8Array (PCM bytes) — encode to base64 here
        // because btoa is not available in AudioWorkletGlobalScope on many browsers
        const bytes = event.data;
        const parts = [];
        for (let i = 0; i < bytes.length; i += 1024) {
          parts.push(String.fromCharCode(...bytes.subarray(i, i + 1024)));
        }
        this.onData(btoa(parts.join('')));
      }
    };

    this.source.connect(this.workletNode);

    // Connect to destination via silent gain node — required for process() to be
    // called on Safari/iOS. Without this, the worklet is a dead-end node and the
    // browser may optimize it away. Safe no-op on browsers that don't require it.
    this.silentGain = this.audioContext.createGain();
    this.silentGain.gain.value = 0;
    this.workletNode.connect(this.silentGain);
    this.silentGain.connect(this.audioContext.destination);
  }

  mute() {
    this._muted = true;
  }

  unmute() {
    this._muted = false;
  }

  get isMuted() {
    return this._muted;
  }

  stop() {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.silentGain) {
      this.silentGain.disconnect();
      this.silentGain = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
