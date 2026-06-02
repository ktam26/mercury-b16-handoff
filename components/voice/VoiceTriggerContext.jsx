'use client';

import { createContext, useContext } from 'react';

const VoiceTriggerContext = createContext({ openVoice: () => {} });

export function VoiceTriggerProvider({ openVoice, children }) {
  return (
    <VoiceTriggerContext.Provider value={{ openVoice }}>
      {children}
    </VoiceTriggerContext.Provider>
  );
}

export function useVoiceTrigger() {
  return useContext(VoiceTriggerContext);
}
