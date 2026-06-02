'use client';

import { useState, useCallback } from 'react';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { VoiceSheet } from './voice/VoiceSheet';
import { VoiceTriggerProvider } from './voice/VoiceTriggerContext';

export function VoiceAssistant({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState('');

  const {
    state,
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
  } = useVoiceAgent();

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    // Don't auto-start voice — let the user choose via the Voice/Text toggle
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    endSession();
  }, [endSession]);

  const handleTextSend = useCallback(() => {
    if (!textInput.trim()) return;
    sendTextMessage(textInput);
    setTextInput('');
  }, [textInput, sendTextMessage]);

  const handleMicToggle = useCallback(() => {
    if (textMode) {
      // Switch to voice mode and start session
      setTextMode(false);
      startSession();
      return;
    }
    if (state === 'listening') {
      endSession();
    } else {
      startSession();
    }
  }, [state, endSession, startSession, textMode, setTextMode]);

  const handleToggleMode = useCallback(() => {
    const newTextMode = !textMode;
    setTextMode(newTextMode);
    if (newTextMode) {
      // Switching to text mode — stop voice session
      endSession();
    } else {
      // Switching to voice mode — start session
      startSession();
    }
  }, [textMode, setTextMode, endSession, startSession]);

  const handleChipSelect = useCallback((query) => {
    sendTextMessage(query);
  }, [sendTextMessage]);

  const isActive = state === 'listening' || state === 'speaking' || state === 'thinking';

  return (
    <VoiceTriggerProvider openVoice={handleOpen}>
      {children}
      <VoiceSheet
        isOpen={isOpen}
        onClose={handleClose}
        state={state}
        inputTranscript={inputTranscript}
        outputTranscript={outputTranscript}
        cards={cards}
        error={error}
        lastToolName={lastToolName}
        textInput={textInput}
        onTextInputChange={setTextInput}
        onTextSend={handleTextSend}
        onMicToggle={handleMicToggle}
        onRetry={retryConnection}
        onChipSelect={handleChipSelect}
        textMode={textMode}
        onToggleMode={handleToggleMode}
        isMuted={isMuted}
        onMuteToggle={toggleMute}
      />
    </VoiceTriggerProvider>
  );
}
