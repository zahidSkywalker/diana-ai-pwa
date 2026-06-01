'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Plus,
  Database,
  Trash2,
  Search,
  Send,
  ArrowLeft,
  PlusCircle,
  FileText,
  Loader2,
  Bot,
  User,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface KBEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface KnowledgeBase {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  entries: KBEntry[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function KnowledgeModule() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKB, setActiveKB] = useState<KnowledgeBase | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      const res = await fetch('/api/knowledge-bases');
      const data = await res.json();
      setKnowledgeBases(data);
    } catch (error) {
      console.error('Failed to load knowledge bases');
    } finally {
      setLoading(false);
    }
  };

  const createKB = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch('/api/knowledge-bases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', title: newTitle.trim(), description: newDescription.trim() }),
    });
    const kb = await res.json();
    setKnowledgeBases((prev) => [kb, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setShowCreate(false);
  };

  const addEntry = async () => {
    if (!activeKB || !entryTitle.trim()) return;
    const res = await fetch('/api/knowledge-bases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addEntry',
        id: activeKB.id,
        entryTitle: entryTitle.trim(),
        entryContent: entryContent.trim(),
      }),
    });
    const entry = await res.json();
    setActiveKB((prev) =>
      prev ? { ...prev, entries: [entry, ...prev.entries] } : null
    );
    setKnowledgeBases((prev) =>
      prev.map((kb) =>
        kb.id === activeKB.id ? { ...kb, entries: [entry, ...kb.entries] } : kb
      )
    );
    setEntryTitle('');
    setEntryContent('');
    setShowAddEntry(false);
  };

  const deleteEntry = async (entryId: string) => {
    await fetch('/api/knowledge-bases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteEntry', entryTitle: entryId }),
    });
    if (activeKB) {
      setActiveKB((prev) =>
        prev ? { ...prev, entries: prev.entries.filter((e) => e.id !== entryId) } : null
      );
    }
    setKnowledgeBases((prev) =>
      prev.map((kb) =>
        kb.id === activeKB?.id
          ? { ...kb, entries: kb.entries.filter((e) => e.id !== entryId) }
          : kb
      )
    );
  };

  const deleteKB = async (id: string) => {
    await fetch(`/api/knowledge-bases?id=${id}`, { method: 'DELETE' });
    setKnowledgeBases((prev) => prev.filter((kb) => kb.id !== id));
    if (activeKB?.id === id) setActiveKB(null);
  };

  const searchKB = async () => {
    if (!searchQuery.trim() || !activeKB || searching) return;
    setSearching(true);
    setChatHistory((prev) => [...prev, { role: 'user', content: searchQuery.trim() }]);

    try {
      const res = await fetch('/api/knowledge-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim(), knowledgeBaseId: activeKB.id }),
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: 'I apologize, Sir. The search failed. Please try again.' },
      ]);
    } finally {
      setSearching(false);
      setSearchQuery('');
    }
  };

  // Active Knowledge Base View
  if (activeKB) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setActiveKB(null)} className="h-7 w-7 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold truncate">{activeKB.title}</h3>
            <p className="text-[9px] text-muted-foreground">{activeKB.entries.length} entries</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddEntry(!showAddEntry)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 text-[10px] h-7 px-2 glow-emerald"
          >
            <PlusCircle className="h-3 w-3" />
            Add
          </Button>
        </div>

        {/* Add Entry Form */}
        {showAddEntry && (
          <div className="px-3 py-2 border-b border-border bg-card/50 space-y-1.5 shrink-0">
            <Input
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
              placeholder="Entry title"
              className="text-[12px] bg-background h-7"
            />
            <Textarea
              value={entryContent}
              onChange={(e) => setEntryContent(e.target.value)}
              placeholder="Paste or type content..."
              className="min-h-[60px] text-[12px] bg-background"
            />
            <div className="flex gap-1.5 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAddEntry(false)} className="text-[10px] h-7">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={addEntry}
                disabled={!entryTitle.trim()}
                className="bg-primary text-primary-foreground text-[10px] h-7"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Entries + Q&A */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Entries List - horizontal scroll on mobile */}
            <div className="w-full lg:w-52 border-b lg:border-b-0 lg:border-r border-border flex flex-col shrink-0">
              <div className="px-2 py-1.5 border-b border-border shrink-0">
                <span className="text-[10px] font-medium text-muted-foreground">Entries</span>
              </div>
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto">
                <div className="flex lg:flex-col p-1.5 gap-1">
                  {activeKB.entries.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/50 text-center py-3 px-4">No entries yet</p>
                  ) : (
                    activeKB.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="group flex items-start gap-1.5 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors shrink-0 min-w-[140px] lg:min-w-0 lg:w-auto"
                      >
                        <FileText className="h-3 w-3 text-primary/40 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium truncate">{entry.title}</p>
                          <p className="text-[9px] text-muted-foreground/50 line-clamp-1 hidden lg:block">{entry.content.substring(0, 60)}...</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Q&A Panel */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-3 space-y-3 max-w-2xl mx-auto">
                  {chatHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Search className="h-5 w-5 text-primary/40" />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center">
                        Ask questions about your knowledge base, Sir.
                      </p>
                    </div>
                  )}

                  {chatHistory.map((msg, i) => (
                    <div key={i} className={cn('flex gap-1.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {msg.role === 'assistant' && (
                        <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] rounded-lg px-2.5 py-2 text-[12px]',
                          msg.role === 'user'
                            ? 'bg-primary/15 text-foreground'
                            : 'bg-card border border-border'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="markdown-content prose-invert text-[12px]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-5 h-5 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {searching && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Loader2 className="h-3 w-3 text-primary animate-spin" />
                      <span>Searching knowledge base...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Input */}
              <div className="border-t border-border p-2 shrink-0">
                <div className="max-w-2xl mx-auto flex gap-1.5">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchKB()}
                    placeholder="Ask about your knowledge base..."
                    className="text-[14px] bg-card h-9"
                    disabled={searching}
                  />
                  <Button
                    onClick={searchKB}
                    disabled={!searchQuery.trim() || searching}
                    size="icon"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 w-9 shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Knowledge Base List View
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2 shrink-0">
        <div className="flex-1">
          <h3 className="text-xs font-semibold">Knowledge Bases</h3>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 text-[11px] h-7 px-2.5 glow-emerald"
        >
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </div>

      {showCreate && (
        <div className="px-3 py-2 border-b border-border bg-card/50 space-y-1.5 shrink-0">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Knowledge base title"
            className="text-[12px] bg-background h-7"
          />
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Brief description (optional)"
            className="text-[12px] bg-background h-7"
          />
          <div className="flex gap-1.5 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-[10px] h-7">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={createKB}
              disabled={!newTitle.trim()}
              className="bg-primary text-primary-foreground text-[10px] h-7"
            >
              Create
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-28" />
              </div>
            ))
          ) : knowledgeBases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Database className="h-6 w-6 text-primary/40" />
              </div>
              <div className="text-center">
                <h4 className="text-xs font-medium text-foreground">No knowledge bases yet, Sir</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Create one to start building your knowledge library
                </p>
              </div>
            </div>
          ) : (
            knowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className="group rounded-lg border border-border hover:border-primary/30 bg-card p-3 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setActiveKB(kb);
                  setChatHistory([]);
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Database className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground">{kb.title}</h4>
                    {kb.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{kb.description}</p>
                    )}
                    <Badge variant="secondary" className="mt-1 text-[9px] h-4 px-1.5">
                      {kb.entries.length} entries
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteKB(kb.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
