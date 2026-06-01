'use client';

import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { Copy, Check, User, Hexagon } from 'lucide-react';
import { useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/hexagon-types';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const timeStr = useMemo(
    () => formatDistanceToNow(message.timestamp, { addSuffix: true }),
    [message.timestamp],
  );

  const handleCopy = (code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(blockId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-4 sm:px-6 transition-colors',
        isUser ? 'bg-transparent' : 'bg-card/30',
        message.isStreaming && 'bg-primary/[0.03]',
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <User className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary glow-emerald">
            <Hexagon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-medium',
            isUser ? 'text-foreground/70' : 'text-primary',
          )}>
            {isUser ? 'You' : 'HexaGon AI'}
          </span>
          <span className="text-[10px] text-muted-foreground/40">{timeStr}</span>
        </div>

        {/* Message body */}
        <div className="text-sm leading-relaxed text-foreground/90 prose-custom">
          {isAssistant ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const blockId = `code-${codeString.slice(0, 20).replace(/\s/g, '')}`;

                  if (match) {
                    return (
                      <div className="relative my-3 overflow-hidden rounded-xl border border-border/40 bg-[#1e1e2e]">
                        <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
                          <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                            {match[1]}
                          </span>
                          <button
                            onClick={() => handleCopy(codeString, blockId)}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
                          >
                            {copiedId === blockId ? (
                              <>
                                <Check className="h-3 w-3 text-green-400" />
                                <span className="text-green-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '0.8125rem',
                            lineHeight: '1.6',
                          }}
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  return (
                    <code
                      className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.8125rem] font-mono text-primary/90"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="mb-2 list-disc pl-5 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="mb-2 list-decimal pl-5 space-y-1">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>;
                },
                h1({ children }) {
                  return <h1 className="text-lg font-bold mb-3 mt-5">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-base font-bold mb-2 mt-4">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-sm font-semibold mb-1.5 mt-3">{children}</h3>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-2 border-primary/40 pl-4 my-3 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  );
                },
                table({ children }) {
                  return (
                    <div className="my-3 overflow-x-auto rounded-lg border border-border/40">
                      <table className="w-full text-xs">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border-b border-border/50 bg-card/50 px-3 py-2 text-left font-semibold">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return <td className="border-b border-border/30 px-3 py-2">{children}</td>;
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline underline-offset-2"
                    >
                      {children}
                    </a>
                  );
                },
                hr() {
                  return <hr className="my-4 border-border/30" />;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Streaming cursor */}
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary rounded-sm animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
});
