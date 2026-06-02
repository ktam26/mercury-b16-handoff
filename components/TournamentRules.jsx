'use client';

import { RulesChat } from './RulesChat';

export function TournamentRules({ rules }) {
  return (
    <div>
      {/* Tournament Chat with Gemini */}
      <RulesChat rules={rules} />
    </div>
  );
}
