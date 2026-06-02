'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import DOMPurify from 'isomorphic-dompurify';

// Simple markdown parser for rich text with XSS sanitization
function parseMarkdown(text) {
  if (!text) return '';

  // Convert ### headers to <h4>
  let html = text.replace(/^###\s+(.+)$/gm, '<h4 class="font-bold text-chalk-white mt-3 mb-1">$1</h4>');

  // Convert **bold** to <strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert numbered lists (1. item)
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="ml-4">$1. $2</li>');

  // Convert bullet points (- item or • item)
  html = html.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4">• $1</li>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="space-y-1 my-2">$&</ul>');

  // Convert line breaks
  html = html.replace(/\n/g, '<br/>');

  // Sanitize to prevent XSS attacks
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'ul', 'li', 'br', 'h4'],
    ALLOWED_ATTR: ['class']
  });
}

export function RulesChat({ rules }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! I can help with tournament questions - rules, scoring, tie breakers, parking, schedule, or anything else!"
    }
  ]);
  const [messageId, setMessageId] = useState(1);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Only scroll to bottom after user interaction, not on initial render
  useEffect(() => {
    if (hasInteracted) {
      scrollToBottom();
    }
  }, [messages, hasInteracted]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const userMsgId = `user-${messageId}`;
    const assistantMsgId = `assistant-${messageId}`;
    setMessageId(prev => prev + 1);

    setInput('');
    setHasInteracted(true);
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/rules-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-6),
          rules
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: "Couldn't process that question. Try checking the rules accordion above or ask a tournament official."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Check-in info?",
    "Scoring points?",
    "Tie breakers?",
    "Mercury schedule?"
  ];

  return (
    <div className="slide-in-up" style={{ animationDelay: '0.6s' }}>
      <div className="stadium-card p-5">
        <h3 className="athletic-heading text-sm font-bold text-chalk-white tracking-wider mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-gold-bright" />
          ASK ABOUT TOURNAMENT
          <span className="athletic-condensed text-[10px] font-normal text-chalk-dim tracking-wider ml-2">
            POWERED BY GEMINI
          </span>
        </h3>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="h-56 overflow-y-auto mb-4 space-y-3 p-3 bg-stadium-black rounded-lg border border-stadium-border">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                message.role === 'assistant'
                  ? "bg-stadium-gray border border-gold-bright/30"
                  : "bg-linear-to-br from-turf-dim to-turf"
              )}>
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4 text-gold-bright" />
                ) : (
                  <User className="w-4 h-4 text-stadium-black" />
                )}
              </div>
              <div className={cn(
                "px-3 py-2 rounded-lg max-w-[80%] athletic-condensed text-sm",
                message.role === 'assistant'
                  ? "chat-bubble-ai"
                  : "chat-bubble-user font-medium"
              )}>
                {message.role === 'assistant' ? (
                  <span dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-stadium-gray border border-gold-bright/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-gold-bright" />
              </div>
              <div className="px-3 py-2 rounded-lg bg-stadium-gray border border-stadium-border">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-turf rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-turf rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-turf rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        {messages.length <= 2 && (
          <div className="mb-4">
            <p className="athletic-condensed text-chalk-dim text-[10px] tracking-wider uppercase mb-2">Quick Questions</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => {
                    setInput(question);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 bg-stadium-gray hover:bg-stadium-border border border-stadium-border hover:border-turf/50 rounded-full athletic-condensed text-xs text-chalk-dim hover:text-chalk-white transition-all"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the tournament..."
            className="flex-1 px-4 py-3 bg-stadium-black border border-stadium-border rounded-lg athletic-condensed text-sm text-chalk-white placeholder-chalk-dim focus:outline-hidden focus:border-turf/50 focus:ring-1 focus:ring-turf/30 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "px-4 py-3 rounded-lg transition-all",
              input.trim() && !isLoading
                ? "bg-linear-to-r from-turf-dim to-turf text-stadium-black hover:opacity-90"
                : "bg-stadium-gray text-chalk-dim cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
