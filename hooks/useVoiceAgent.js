'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GeminiLiveClient } from '@/lib/voice/gemini-live-client';
import { AudioStreamer } from '@/lib/voice/audio-streamer';
import { AudioPlayer } from '@/lib/voice/audio-player';
import { VOICE_TOOL_DECLARATIONS, VOICE_SYSTEM_PROMPT } from '@/lib/voice/tool-definitions';

const STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

const MAX_RETRIES = 3;
const SESSION_TIMEOUT_MS = 9.5 * 60 * 1000; // Reconnect before 10-min limit

function checkBrowserSupport() {
  if (typeof window === 'undefined') return 'Not available in server environment';
  if (!window.WebSocket) return 'Your browser does not support WebSocket';
  if (!window.AudioContext && !window.webkitAudioContext) return 'Your browser does not support audio playback';
  if (!navigator.mediaDevices?.getUserMedia) return 'Your browser does not support microphone access';
  return null;
}

export function useVoiceAgent() {
  const [state, setState] = useState(STATES.IDLE);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [cards, setCards] = useState([]);
  const [error, setError] = useState(null);
  const [lastToolName, setLastToolName] = useState(null);
  const [textMode, setTextMode] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const clientRef = useRef(null);
  const streamerRef = useRef(null);
  const playerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const isSessionActiveRef = useRef(false);
  const pendingTextRef = useRef(null);
  const chatHistoryRef = useRef([]);

  const cleanup = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.close();
      playerRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    isSessionActiveRef.current = false;
    pendingTextRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleToolCall = useCallback(async (functionCalls) => {
    setState(STATES.THINKING);

    try {
      const calls = functionCalls.map(fc => ({
        name: fc.name,
        id: fc.id,
        args: fc.args || {},
      }));

      const response = await fetch('/api/voice-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calls }),
      });

      if (!response.ok) throw new Error('Tool execution failed');

      const { results } = await response.json();

      // Add cards from results
      const newCards = results.map(r => ({
        toolName: r.name,
        data: r.response,
        card: r.card || null,
      }));
      setCards(prev => [...prev, ...newCards]);
      setLastToolName(results[0]?.name || null);

      // Send tool responses back to Gemini
      const functionResponses = results.map(r => ({
        id: r.id,
        name: r.name,
        response: { result: r.response },
      }));

      if (clientRef.current) {
        clientRef.current.sendToolResponse(functionResponses);
      }
    } catch (err) {
      console.error('Tool call error:', err);
      setState(STATES.ERROR);
      setError('Failed to look up team data. Try again.');
    }
  }, []);

  const startSession = useCallback(async () => {
    // Browser compatibility check
    const compatError = checkBrowserSupport();
    if (compatError) {
      setState(STATES.ERROR);
      setError(compatError);
      return;
    }

    const savedPendingText = pendingTextRef.current;
    cleanup();
    pendingTextRef.current = savedPendingText;
    setState(STATES.CONNECTING);
    setError(null);
    setInputTranscript('');
    setOutputTranscript('');

    try {
      // 1. Start mic capture + token fetch in parallel to reduce startup delay
      const streamer = new AudioStreamer();
      const [, tokenRes] = await Promise.all([
        streamer.start(),
        fetch('/api/voice-token', { method: 'POST' }),
      ]);

      // Store streamer early so cleanup can stop it if something fails later
      streamerRef.current = streamer;

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get voice token');
      }
      const { token } = await tokenRes.json();

      // 2. Create audio player (lazy — context created on first chunk)
      playerRef.current = new AudioPlayer();

      // 3. Create Gemini client
      const client = new GeminiLiveClient({
        systemInstruction: VOICE_SYSTEM_PROMPT,
        tools: VOICE_TOOL_DECLARATIONS,
        onAudio: (data) => {
          if (playerRef.current) {
            playerRef.current.addChunk(data);
          }
          setState(STATES.SPEAKING);
        },
        onText: (text) => {
          setOutputTranscript(prev => prev + text);
        },
        onToolCall: handleToolCall,
        onInputTranscription: (text) => {
          setInputTranscript(text);
        },
        onOutputTranscription: (text) => {
          setOutputTranscript(prev => prev + text);
        },
        onSetupComplete: () => {
          setState(STATES.LISTENING);
          retryCountRef.current = 0; // Reset on successful connection
          // Wire audio streaming NOW — session is ready to receive audio
          if (streamerRef.current && clientRef.current) {
            streamerRef.current.onData = (base64Data) => {
              clientRef.current.sendAudio(base64Data);
            };
          }
          // Send any pending text message queued before setup completed
          if (pendingTextRef.current && clientRef.current) {
            clientRef.current.sendText(pendingTextRef.current);
            setInputTranscript(pendingTextRef.current);
            pendingTextRef.current = null;
          }
          // Start session timeout for auto-reconnect
          sessionTimerRef.current = setTimeout(async () => {
            if (isSessionActiveRef.current) {
              await startSession();
            }
          }, SESSION_TIMEOUT_MS);
        },
        onInterrupted: () => {
          if (playerRef.current) {
            playerRef.current.interrupt();
          }
          setState(STATES.LISTENING);
          setOutputTranscript('');
        },
        onTurnComplete: () => {
          // Stay in LISTENING — session is still active, ready for next input
          setState(STATES.LISTENING);
        },
        onError: (err) => {
          console.error('Gemini Live error:', err);
          setState(STATES.ERROR);
          setError('Connection error. Try again.');
        },
        onClose: (e) => {
          // GoAway signal — server is asking us to reconnect immediately
          if (e?.goAway && isSessionActiveRef.current) {
            startSession();
            return;
          }
          // Auto-retry if session was active (unexpected disconnect)
          if (isSessionActiveRef.current && retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++;
            const delay = Math.pow(2, retryCountRef.current) * 1000;
            setTimeout(() => {
              if (isSessionActiveRef.current) {
                startSession();
              }
            }, delay);
          } else if (isSessionActiveRef.current) {
            setState(STATES.ERROR);
            setError('Connection lost. Please try again.');
            isSessionActiveRef.current = false;
          }
        },
      });

      clientRef.current = client;

      // Timeout prevents getting stuck on "Connecting" if the server never responds
      const connectTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out. Please try again.')), 10000)
      );
      await Promise.race([client.connect(token), connectTimeout]);

      isSessionActiveRef.current = true;
      // Audio wiring happens in onSetupComplete — Gemini drops audio sent before setupComplete
    } catch (err) {
      console.error('Session start error:', err);
      cleanup();
      setState(STATES.ERROR);
      setError(err.message || 'Failed to start voice session');
    }
  }, [cleanup, handleToolCall]);

  const endSession = useCallback(() => {
    isSessionActiveRef.current = false;
    // Flush cached audio before disconnecting
    if (clientRef.current) {
      clientRef.current.sendAudioStreamEnd();
    }
    cleanup();
    setState(STATES.IDLE);
    setIsMuted(false);
    setInputTranscript('');
    setOutputTranscript('');
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    if (!streamerRef.current) return;
    if (streamerRef.current.isMuted) {
      streamerRef.current.unmute();
      setIsMuted(false);
    } else {
      streamerRef.current.mute();
      setIsMuted(true);
      // Flush any cached audio on the server so Gemini doesn't
      // try to interpret buffered silence as speech
      if (clientRef.current) {
        clientRef.current.sendAudioStreamEnd();
      }
    }
  }, []);

  // Text-only chat via /api/team-chat (no mic, no audio, no Live API)
  const sendTextOnly = useCallback(async (text) => {
    setInputTranscript(text);
    setOutputTranscript('');
    setCards([]);
    setState(STATES.THINKING);
    setError(null);

    try {
      const res = await fetch('/api/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistoryRef.current.slice(-10),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get response');
      }

      const data = await res.json();
      chatHistoryRef.current.push(
        { role: 'user', content: text },
        { role: 'assistant', content: data.response },
      );
      if (data.toolResults?.length) {
        setCards(data.toolResults.map(r => ({ toolName: r.name, data: r.data, card: r.card || null })));
      }
      setOutputTranscript(data.response);
      setState(STATES.IDLE);
    } catch (err) {
      console.error('Text chat error:', err);
      setState(STATES.ERROR);
      setError(err.message || 'Failed to get response');
    }
  }, []);

  const sendTextMessage = useCallback((text) => {
    if (!text.trim()) return;

    // Text mode: use /api/team-chat directly (no Live API)
    if (textMode) {
      sendTextOnly(text);
      return;
    }

    if (!clientRef.current || state === STATES.IDLE || state === STATES.ERROR) {
      // Queue the text and start a session — onSetupComplete will send it
      pendingTextRef.current = text;
      setInputTranscript(text);
      setOutputTranscript('');
      setCards([]);
      startSession();
      return;
    }

    if (clientRef.current) {
      clientRef.current.sendText(text);
      setInputTranscript(text);
      setOutputTranscript('');
      setCards([]);
    }
  }, [state, startSession, textMode, sendTextOnly]);

  const retryConnection = useCallback(() => {
    retryCountRef.current = 0;
    startSession();
  }, [startSession]);

  return {
    state,
    isSessionActive: isSessionActiveRef.current,
    inputTranscript,
    outputTranscript,
    cards,
    error,
    lastToolName,
    textMode,
    setTextMode,
    isMuted,
    toggleMute,
    startSession,
    endSession,
    sendTextMessage,
    retryConnection,
  };
}
