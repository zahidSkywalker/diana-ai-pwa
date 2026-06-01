'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore, type ChatMode } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Lightbulb,
  HelpCircle,
  Search,
  BarChart3,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  RefreshCw,
  ChevronDown,
  Brain,
  Cpu,
  BookOpen,
  Target,
  Eye,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const chatModes: { id: ChatMode; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-3.5 w-3.5" />, description: 'General conversation', color: 'text-emerald-400' },
  { id: 'solve', label: 'Solve', icon: <Lightbulb className="h-3.5 w-3.5" />, description: 'Step-by-step solutions', color: 'text-amber-400' },
  { id: 'quiz', label: 'Quiz', icon: <HelpCircle className="h-3.5 w-3.5" />, description: 'Test your knowledge', color: 'text-blue-400' },
  { id: 'research', label: 'Research', icon: <Search className="h-3.5 w-3.5" />, description: 'Deep topic research', color: 'text-purple-400' },
  { id: 'visualize', label: 'Visual', icon: <BarChart3 className="h-3.5 w-3.5" />, description: 'Charts & diagrams', color: 'text-pink-400' },
];

const thinkingSteps = [
  { icon: <Cpu className="h-3 w-3" />, text: 'Understanding your query...' },
  { icon: <Brain className="h-3 w-3" />, text: 'Analyzing context...' },
  { icon: <BookOpen className="h-3 w-3" />, text: 'Retrieving knowledge...' },
  { icon: <Target className="h-3 w-3" />, text: 'Formulating response...' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: ChatMode;
}

export function ChatModule() {
  const { chatMode, setChatMode } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [thinkingStep, setThinkingStep] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, thinkingStep, scrollToBottom]);

  // Thinking animation cycle
  useEffect(() => {
    if (!isLoading) {
      setThinkingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingStep((prev) => (prev + 1) % thinkingSteps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = async (messageId: string) => {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;

    // Find the user message before this assistant message
    let userContent = '';
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userContent = messages[i].content;
        break;
      }
    }
    if (!userContent) return;

    // Remove the assistant message and everything after
    setMessages((prev) => prev.slice(0, idx));
    setInput(userContent);

    // Auto-send after a brief delay
    setTimeout(() => {
      const syntheticEvent = { key: 'Enter', shiftKey: false, preventDefault: () => {} } as React.KeyboardEvent<HTMLTextAreaElement>;
      handleKeyDown(syntheticEvent);
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const chatMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          mode: chatMode,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch {
              // Skip malformed JSON
            }
          } else if (line.trim()) {
            fullContent += chunk;
            setStreamingContent(fullContent);
            break;
          }
        }
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        mode: chatMode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, Sir. I encountered an error processing your request. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setStreamingContent('');
  };

  const modeInfo = chatModes.find(m => m.id === chatMode);

  const getFollowUps = (mode: ChatMode, lastMsg: string): string[] => {
    const truncated = lastMsg.slice(-200).toLowerCase();
    if (mode === 'solve') {
      return ['Try a similar problem', 'Explain it differently', 'Show me a real-world example'];
    }
    if (mode === 'quiz') {
      return ['Next question', 'Easier question', 'Explain the answer'];
    }
    if (mode === 'research') {
      return ['Go deeper on this', 'Related topics', 'Summarize key points'];
    }
    if (mode === 'visualize') {
      return ['Create a comparison', 'Show me a diagram', 'More details'];
    }
    return ['Tell me more', 'Give me an example', 'Can you simplify that?'];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Compact Mode Tabs + Actions */}
      <div className="border-b border-border px-2 py-1.5 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {chatModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setChatMode(mode.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all duration-200',
                chatMode === mode.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {mode.icon}
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewChat}
            className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">
          {/* Empty State */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center glow-emerald"
              >
                <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </motion.div>
              <div className="text-center space-y-1">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Hey Sir, how can I help?
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  I&apos;m JARVIS. Ask me anything or pick a mode to get started.
                </p>
              </div>

              {/* Mode indicator */}
              {modeInfo && (
                <div className="glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
                  <span className={modeInfo.color}>{modeInfo.icon}</span>
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">{modeInfo.label}</span> — {modeInfo.description}
                  </span>
                </div>
              )}

              {/* Quick Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full max-w-md">
                {getSuggestionPrompts(chatMode).map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="text-left text-[11px] text-muted-foreground hover:text-foreground p-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-primary/50 mb-0.5" />
                    <span className="group-hover:text-primary transition-colors">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={cn('flex gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {message.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className="max-w-[88%] sm:max-w-[75%] min-w-0">
                <div
                  className={cn(
                    'rounded-xl px-3 py-2 text-[13px]',
                    message.role === 'user'
                      ? 'bg-primary/15 text-foreground border border-primary/20'
                      : 'bg-card border border-border'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="markdown-content prose-invert text-[13px]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>

                {/* Action buttons for assistant messages */}
                {message.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                  <div className="flex items-center gap-1 mt-1 ml-0.5">
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="text-muted-foreground/50 hover:text-foreground p-1 rounded transition-colors"
                      title="Copy"
                    >
                      {copiedId === message.id ? (
                        <span className="text-[10px] text-primary">Copied!</span>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRegenerate(message.id)}
                      className="text-muted-foreground/50 hover:text-foreground p-1 rounded transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Follow-up suggestions after last assistant message */}
                {message.role === 'assistant' && index === messages.length - 1 && !isLoading && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {getFollowUps(chatMode, message.content).map((followUp, fi) => (
                      <button
                        key={fi}
                        onClick={() => {
                          setInput(followUp);
                          textareaRef.current?.focus();
                        }}
                        className="text-[10px] text-muted-foreground hover:text-primary px-2 py-1 rounded-full border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Agentic Thinking Indicator */}
          {isLoading && !streamingContent && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 justify-start"
            >
              <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
              </div>
              <div className="rounded-xl px-3 py-2.5 bg-card border border-border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={thinkingStep}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-[11px] text-muted-foreground flex items-center gap-1.5"
                    >
                      {thinkingSteps[thinkingStep].icon}
                      {thinkingSteps[thinkingStep].text}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* Streaming message */}
          {isLoading && streamingContent && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="max-w-[88%] sm:max-w-[75%] rounded-xl px-3 py-2 text-[13px] bg-card border border-border">
                <div className="markdown-content prose-invert text-[13px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingContent}
                  </ReactMarkdown>
                </div>
                <span className="typing-cursor" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Input Area */}
      <div className="border-t border-border p-2 shrink-0 safe-area-input">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-1.5 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask JARVIS (${modeInfo?.label || 'Chat'})...`}
                className="min-h-[40px] max-h-[150px] resize-none bg-card border-border rounded-xl pr-10 py-2 text-[16px] leading-tight placeholder:text-muted-foreground/50 placeholder:text-sm focus:border-primary/50 focus:ring-primary/20"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[40px] w-[40px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground glow-emerald disabled:opacity-40 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground/30 mt-1 text-center">
            <kbd className="px-1 py-0.5 rounded bg-secondary/50 text-[8px]">Enter</kbd> send · <kbd className="px-1 py-0.5 rounded bg-secondary/50 text-[8px]">Shift+Enter</kbd> new line
          </p>
        </div>
      </div>
    </div>
  );
}

function getSuggestionPrompts(mode: ChatMode): string[] {
  switch (mode) {
    case 'chat':
      return [
        'Explain quantum computing simply',
        'Latest trends in AI?',
        'Help me learn machine learning',
        'Future of web development?',
      ];
    case 'solve':
      return [
        'Solve: 2x + 5 = 15',
        'Binary search in Python',
        'Derive the quadratic formula',
        'Explain Big-O with examples',
      ];
    case 'quiz':
      return [
        'Quiz me on JavaScript',
        'Test my history knowledge',
        'Data structures quiz',
        'Chemistry questions',
      ];
    case 'research':
      return [
        'History and evolution of AI',
        'How transformers work',
        'Renewable energy in 2025',
        'State of quantum computing',
      ];
    case 'visualize':
      return [
        'AI adoption rate chart',
        'How neural networks learn',
        'Software dev lifecycle',
        'Sorting algorithm comparison',
      ];
    default:
      return [];
  }
}
