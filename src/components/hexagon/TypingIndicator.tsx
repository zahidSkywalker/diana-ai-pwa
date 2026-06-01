'use client';

import { Hexagon } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-4 sm:px-6 bg-card/30">
      <div className="shrink-0 pt-0.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary glow-emerald">
          <Hexagon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-primary">HexaGon AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
                style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground/50 ml-1">Thinking...</span>
        </div>
      </div>
    </div>
  );
}
