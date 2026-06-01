'use client';

import { cn } from '@/lib/utils';
import { ChatSession } from '@/lib/hexagon-types';
import {
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  Hexagon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  isOpen,
  onToggle,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const startEditing = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  // Group sessions by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = {
    today: sortedSessions.filter((s) => s.updatedAt >= today.getTime()),
    yesterday: sortedSessions.filter(
      (s) => s.updatedAt >= yesterday.getTime() && s.updatedAt < today.getTime(),
    ),
    week: sortedSessions.filter(
      (s) => s.updatedAt >= weekAgo.getTime() && s.updatedAt < yesterday.getTime(),
    ),
    older: sortedSessions.filter((s) => s.updatedAt < weekAgo.getTime()),
  };

  const renderGroup = (label: string, items: ChatSession[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label} className="mb-3">
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
          {label}
        </p>
        {items.map((session) => (
          <div
            key={session.id}
            className={cn(
              'group relative mx-1 mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all duration-150',
              activeSessionId === session.id
                ? 'bg-primary/10 text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
            )}
            onClick={() => onSelectSession(session.id)}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />

            {editingId === session.id ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  ref={editInputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="flex-1 min-w-0 bg-input/50 border border-border/50 rounded px-1.5 py-0.5 text-xs outline-none focus:border-primary/50"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                  className="text-green-400 hover:text-green-300"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 truncate text-xs">{session.title}</span>
                <div
                  className="hidden group-hover:flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => startEditing(session)}
                    className="p-0.5 rounded text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDeleteSession(session.id)}
                    className="p-0.5 rounded text-muted-foreground/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:relative z-50 h-full flex flex-col bg-card/50 backdrop-blur-xl border-r border-border/30 transition-all duration-300 w-[280px]',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
              <Hexagon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">HexaGon AI</h2>
              <p className="text-[10px] text-muted-foreground/50">v1.0 Chat</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onToggle}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-2">
          <Button
            onClick={() => { onNewSession(); if (window.innerWidth < 768) onToggle(); }}
            className="w-full justify-start gap-2 h-9 text-xs rounded-lg border border-dashed border-border/50 bg-transparent hover:bg-primary/5 hover:border-primary/30 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>

        {/* Sessions list */}
        <ScrollArea className="flex-1 px-1">
          <div className="py-1">
            {sessions.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/40">No conversations yet</p>
                <p className="text-[10px] text-muted-foreground/30 mt-1">Start a new chat</p>
              </div>
            ) : (
              <>
                {renderGroup('Today', groups.today)}
                {renderGroup('Yesterday', groups.yesterday)}
                {renderGroup('This Week', groups.week)}
                {renderGroup('Older', groups.older)}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground/30 text-center">
            Powered by Echo AI
          </p>
        </div>
      </aside>

      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute top-3 left-3 z-30 h-8 w-8 text-muted-foreground hover:text-foreground bg-card/80 backdrop-blur-sm border border-border/30 rounded-lg md:hidden"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}
