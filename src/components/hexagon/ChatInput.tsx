'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Square,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Speech recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setMessage(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, isLoading, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div
          className={cn(
            'relative flex items-end gap-2 rounded-2xl border bg-card/80 px-3 py-2 transition-all duration-200',
            isRecording
              ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
              : 'border-border/50 focus-within:border-primary/40 focus-within:shadow-[0_0_15px_rgba(168,85,247,0.1)]',
          )}
        >
          {/* Attachment button placeholder */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground rounded-lg"
            disabled
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message HexaGon AI..."
            disabled={disabled}
            className={cn(
              'flex-1 resize-none border-0 bg-transparent p-0 text-sm leading-relaxed',
              'placeholder:text-muted-foreground/50 focus-visible:ring-0',
              'min-h-[24px] max-h-[200px]',
            )}
            rows={1}
          />

          {/* Voice input toggle */}
          {typeof window !== 'undefined' && 'SpeechRecognition' in window && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRecording}
              className={cn(
                'h-8 w-8 shrink-0 rounded-lg transition-colors',
                isRecording
                  ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              disabled={disabled}
            >
              {isRecording ? (
                <Square className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon"
            className={cn(
              'h-8 w-8 shrink-0 rounded-lg transition-all duration-200',
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground/40">
          HexaGon AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
