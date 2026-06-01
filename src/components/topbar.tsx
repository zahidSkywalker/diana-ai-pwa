'use client';

import { useAppStore } from '@/lib/store';
import { Bot, Sparkles } from 'lucide-react';

const moduleTitles: Record<string, string> = {
  chat: 'Chat',
  cowriter: 'Co-Writer',
  books: 'Book Engine',
  knowledge: 'Knowledge Base',
  space: 'Space',
};

const moduleDescriptions: Record<string, string> = {
  chat: 'Ask me anything, Sir',
  cowriter: 'Write with AI assistance',
  books: 'Generate learning books',
  knowledge: 'Build your knowledge library',
  space: 'Your learning dashboard',
};

export function TopBar() {
  const { activeModule } = useAppStore();

  return (
    <header className="h-11 border-b border-border flex items-center justify-between px-3 shrink-0">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-foreground leading-tight">
            {moduleTitles[activeModule]}
          </h2>
          <p className="text-[9px] text-muted-foreground/70 hidden sm:block leading-tight">
            {moduleDescriptions[activeModule]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Online</span>
        </div>
        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary">ZI</span>
        </div>
      </div>
    </header>
  );
}
