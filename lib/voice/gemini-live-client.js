import { GoogleGenAI, Modality, StartSensitivity, EndSensitivity } from '@google/genai';

const DEFAULT_MODEL = 'gemini-3.1-flash-live-preview';
const DEFAULT_VOICE = 'Kore';

export class GeminiLiveClient {
  constructor(config = {}) {
    this.model = config.model || DEFAULT_MODEL;
    this.systemInstruction = config.systemInstruction || '';
    this.tools = config.tools || [];
    this.voice = config.voice || DEFAULT_VOICE;

    this.onAudio = config.onAudio || (() => {});
    this.onText = config.onText || (() => {});
    this.onToolCall = config.onToolCall || (() => {});
    this.onInputTranscription = config.onInputTranscription || (() => {});
    this.onOutputTranscription = config.onOutputTranscription || (() => {});
    this.onSetupComplete = config.onSetupComplete || (() => {});
    this.onInterrupted = config.onInterrupted || (() => {});
    this.onTurnComplete = config.onTurnComplete || (() => {});
    this.onError = config.onError || (() => {});
    this.onClose = config.onClose || (() => {});

    this.session = null;
  }

  async connect(token) {
    const ai = new GoogleGenAI({
      apiKey: token,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    this.session = await ai.live.connect({
      model: this.model,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: this.voice },
          },
        },
        temperature: 0.7,
        thinkingLevel: 'minimal',
        systemInstruction: this.systemInstruction,
        tools: [{ functionDeclarations: this.tools }],
        realtimeInputConfig: {
          automaticActivityDetection: {
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
            prefixPaddingMs: 20,
            silenceDurationMs: 500,
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {},
        onmessage: (data) => {
          this._handleMessage(data);
        },
        onerror: (e) => {
          console.error('Gemini WebSocket error:', e);
          this.onError(e);
        },
        onclose: (e) => {
          if (e.code !== 1000) {
            console.error(`WebSocket closed: code=${e.code} reason=${e.reason}`);
          }
          this.onClose(e);
        },
      },
    });
  }

  _handleMessage(data) {
    if (data.setupComplete) {
      this.onSetupComplete();
      return;
    }

    if (data.serverContent) {
      const content = data.serverContent;

      if (content.modelTurn && content.modelTurn.parts) {
        for (const part of content.modelTurn.parts) {
          if (part.inlineData && part.inlineData.data) {
            this.onAudio(part.inlineData.data);
          }
          if (part.text) {
            this.onText(part.text);
          }
        }
      }

      if (content.inputTranscription && content.inputTranscription.text) {
        this.onInputTranscription(content.inputTranscription.text);
      }

      if (content.outputTranscription && content.outputTranscription.text) {
        this.onOutputTranscription(content.outputTranscription.text);
      }

      if (content.interrupted === true) {
        this.onInterrupted();
      }

      if (content.turnComplete === true) {
        this.onTurnComplete();
      }
    }

    if (data.toolCall && data.toolCall.functionCalls) {
      this.onToolCall(data.toolCall.functionCalls);
      return;
    }

    // GoAway signal — server is about to close the connection.
    // Trigger a clean reconnect before the forced disconnect.
    if (data.goAway) {
      this.onClose({ code: 1000, reason: 'goaway', goAway: true });
      return;
    }
  }

  sendAudio(base64Data) {
    if (!this.session) return;
    this.session.sendRealtimeInput({
      audio: {
        data: base64Data,
        mimeType: 'audio/pcm;rate=16000',
      },
    });
  }

  sendText(text) {
    if (!this.session) return;
    // For gemini-3.1-flash-live-preview, sendRealtimeInput handles ALL
    // real-time input (audio, video, text). sendClientContent is only for
    // seeding initial context history.
    this.session.sendRealtimeInput({ text });
  }

  sendAudioStreamEnd() {
    if (!this.session) return;
    this.session.sendRealtimeInput({ audioStreamEnd: true });
  }

  sendToolResponse(functionResponses) {
    if (!this.session) return;
    this.session.sendToolResponse({ functionResponses });
  }

  disconnect() {
    if (this.session) {
      // Signal end of audio stream before closing so Gemini flushes cached audio
      try { this.session.sendRealtimeInput({ audioStreamEnd: true }); } catch (_) {}
      this.session.close();
      this.session = null;
    }
  }
}
