'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Sparkles, Send, X, Loader2, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Quick action chips ---
const QUICK_CHIPS = [
  'Next game?',
  'Top scorer',
  'Our record',
  'Roster',
  'Tournament',
];

// --- Bot avatar ---
function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-stadium-gray border border-gold-bright/30 flex items-center justify-center shrink-0">
      <Zap className="w-3.5 h-3.5 text-gold-bright" />
    </div>
  );
}

// --- Loading dots ---
function TypingIndicator() {
  return (
    <div className="flex gap-2 items-start">
      <BotAvatar />
      <div className="px-3 py-2.5 rounded-lg bg-stadium-gray border border-stadium-border">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-turf rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-turf rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-turf rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// --- Chat message bubble ---
function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-2', isUser && 'flex-row-reverse')}
    >
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          'px-3 py-2.5 rounded-xl max-w-[85%] text-sm leading-relaxed',
          isUser
            ? 'chat-bubble-user font-medium rounded-br-sm'
            : 'bg-stadium-dark border border-stadium-border border-l-2 border-l-turf/60 rounded-bl-sm text-chalk-white'
        )}
      >
        {isUser ? (
          <span>{message.content}</span>
        ) : (
          <div className="[&_strong]:font-semibold [&_li]:text-chalk-dim [&_li]:text-[13px] [&_table]:w-full [&_table]:text-xs [&_table]:my-2 [&_th]:text-left [&_th]:text-chalk-white [&_th]:font-bold [&_th]:pb-1 [&_th]:pr-3 [&_th]:border-b [&_th]:border-stadium-border [&_td]:py-1 [&_td]:pr-3 [&_td]:text-chalk-dim [&_td]:border-b [&_td]:border-stadium-border/30 [&_h4]:font-bold [&_h4]:text-chalk-white [&_h4]:mt-3 [&_h4]:mb-1 [&_a]:text-turf [&_a]:underline [&_ul]:space-y-1 [&_ul]:my-2 [&_ol]:space-y-1 [&_ol]:my-2 [&_ol]:ml-4 [&_ul]:ml-4 [&_p]:mb-1 [&_p:last-child]:mb-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Main TeamChatbot component ---
export function TeamChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! Ask me anything about Mercury B16 — schedule, stats, roster, tournaments, or photos.",
    },
  ]);
  const [messageId, setMessageId] = useState(1);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [fabVisible, setFabVisible] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const sheetRef = useRef(null);
  const prevMessageCount = useRef(1);

  // Delay FAB entrance
  useEffect(() => {
    const timer = setTimeout(() => setFabVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Body scroll lock when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Handle virtual keyboard resize via visualViewport API
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      if (!sheetRef.current) return;

      const keyboardOpen = vv.height < window.innerHeight * 0.85;

      if (keyboardOpen) {
        const bottomOffset = window.innerHeight - vv.height - vv.offsetTop;
        sheetRef.current.style.height = `${vv.height * 0.9}px`;
        sheetRef.current.style.bottom = `${Math.max(0, bottomOffset)}px`;

        // Ensure messages stay scrolled to bottom when keyboard opens
        if (chatContainerRef.current) {
          requestAnimationFrame(() => {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          });
        }
      } else {
        // Keyboard closed — clear inline overrides so CSS takes over
        sheetRef.current.style.height = '';
        sheetRef.current.style.bottom = '';
      }
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, [isOpen]);

  // Scroll to bottom only on new messages (not viewport resize)
  useEffect(() => {
    if (messages.length > prevMessageCount.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  // Focus input when sheet opens — desktop only (avoid triggering keyboard on mobile)
  useEffect(() => {
    if (isOpen && window.matchMedia('(pointer: fine)').matches) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsgId = `user-${messageId}`;
    const assistantMsgId = `assistant-${messageId}`;
    setMessageId(prev => prev + 1);
    setInput('');
    setHasInteracted(true);
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text.trim() }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-8),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: data.response },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: "Sorry, I couldn't process that. Try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messageId, messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
    // Keep input focused on mobile so keyboard stays up
    inputRef.current?.focus();
  };

  const handleChipClick = (label) => {
    sendMessage(label);
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {fabVisible && !isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed z-49 right-4 bottom-[5.5rem] w-14 h-14 rounded-full bg-gradient-to-br from-turf-dim to-turf flex items-center justify-center shadow-lg shadow-turf/20 active:scale-95 transition-transform"
            aria-label="Open team assistant"
            style={{ zIndex: 49 }}
          >
            <MessageCircle className="w-6 h-6 text-stadium-black" />
            <Sparkles className="w-3 h-3 text-stadium-black absolute top-2.5 right-2.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              style={{ zIndex: 50 }}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsOpen(false);
                }
              }}
              ref={sheetRef}
              className="fixed bottom-0 left-0 right-0 bg-stadium-black border-t border-stadium-border rounded-t-2xl flex flex-col overflow-hidden md:left-auto md:right-4 md:w-[420px] md:bottom-4 md:rounded-2xl md:border"
              style={{ zIndex: 51, height: '90svh', maxHeight: '90svh' }}
            >
              {/* Handle + Header */}
              <div className="flex-shrink-0 pt-2 pb-3 px-4 border-b border-stadium-border cursor-grab active:cursor-grabbing touch-none">
                {/* Drag handle */}
                <div className="w-10 h-1 bg-stadium-border rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-turf-dim to-turf flex items-center justify-center">
                      <Zap className="w-4 h-4 text-stadium-black" />
                    </div>
                    <div>
                      <h2 className="athletic-heading text-sm font-bold text-chalk-white tracking-wider leading-tight">
                        MERCURY ASSISTANT
                      </h2>
                      <p className="text-[10px] text-chalk-dim athletic-condensed tracking-wider">
                        POWERED BY AI
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-stadium-gray flex items-center justify-center hover:bg-stadium-border transition-colors -mr-1.5 p-0 before:absolute before:inset-[-6px] before:content-[''] relative"
                    aria-label="Close assistant"
                  >
                    <X className="w-4 h-4 text-chalk-dim" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div
                ref={chatContainerRef}
                aria-live="polite"
                className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain"
              >
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}

                {isLoading && <TypingIndicator />}

                {/* Quick chips — show after welcome message only */}
                {messages.length <= 1 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="pt-2"
                  >
                    <p className="athletic-condensed text-chalk-dim text-[10px] tracking-wider uppercase mb-2 ml-9">
                      TRY ASKING
                    </p>
                    <div className="flex flex-wrap gap-2 ml-9">
                      {QUICK_CHIPS.map(chip => (
                        <button
                          key={chip}
                          onClick={() => handleChipClick(chip)}
                          className="px-3 py-2 bg-stadium-gray hover:bg-stadium-border border border-stadium-border hover:border-turf/40 rounded-full athletic-condensed text-xs text-chalk-dim hover:text-chalk-white transition-all active:scale-95"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input bar */}
              <div className="flex-shrink-0 p-3 border-t border-stadium-border bg-stadium-black safe-area-bottom">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about the team..."
                    className="flex-1 px-4 py-3 bg-stadium-dark border border-stadium-border rounded-xl athletic-condensed text-sm text-chalk-white placeholder-chalk-dim focus:outline-hidden focus:border-turf/50 focus:ring-1 focus:ring-turf/30 transition-all"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                    className={cn(
                      'px-4 py-3 rounded-xl transition-all active:scale-95',
                      input.trim() && !isLoading
                        ? 'bg-gradient-to-r from-turf-dim to-turf text-stadium-black hover:opacity-90'
                        : 'bg-stadium-gray text-chalk-dim cursor-not-allowed'
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
