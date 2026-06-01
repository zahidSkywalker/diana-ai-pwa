'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Send,
  Plus,
  Save,
  FileText,
  Bot,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Quote,
  Download,
  Sparkles,
  Wand2,
  Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Document {
  id: string;
  title: string;
  content: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function CoWriterModule() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [docContent, setDocContent] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showDocList, setShowDocList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingContent]);

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents');
    }
  };

  const createNewDoc = async () => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Document', content: '' }),
    });
    const doc = await res.json();
    setDocuments((prev) => [doc, ...prev]);
    setActiveDoc(doc);
    setDocContent('');
    setDocTitle(doc.title);
    setShowDocList(false);
  };

  const saveDoc = async () => {
    if (!activeDoc) return;
    setSaving(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeDoc.id,
          title: docTitle || 'Untitled Document',
          content: docContent,
        }),
      });
      const updated = await res.json();
      setDocuments((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
      setActiveDoc(updated);
    } catch (error) {
      console.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: chatInput.trim(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const allMessages = [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      if (activeDoc) {
        allMessages.push({
          role: 'user',
          content: `[Current document content for context]:\n${docContent}`,
        });
        allMessages.push({
          role: 'assistant',
          content: 'Understood. I have the document context. How can I help?',
        });
      }

      const response = await fetch('/api/cowriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch { /* skip */ }
          }
        }
      }

      setChatMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: fullContent },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'I apologize, Sir. Please try again.' },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('doc-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = docContent.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = docContent.substring(0, start) + replacement + docContent.substring(end);
    setDocContent(newContent);
  };

  const handleApplyToDoc = (text: string) => {
    setDocContent((prev) => prev + '\n\n' + text);
  };

  const downloadDoc = () => {
    const blob = new Blob([docContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Compact Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setShowDocList(!showDocList)}>
          <FileText className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border" />
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => insertFormatting('# ', '\n')}>
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => insertFormatting('**', '**')}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => insertFormatting('*', '*')}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => insertFormatting('- ', '\n')}>
          <List className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50 mr-2">
          <span>{docContent.split(/\s+/).filter(Boolean).length}w</span>
          <span>{docContent.length}c</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowChat(!showChat)} className={cn(
          'h-7 gap-1 text-[10px]',
          showChat ? 'text-primary' : 'text-muted-foreground'
        )}>
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={downloadDoc} className="h-7 text-muted-foreground">
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={saveDoc} disabled={saving} className="h-7 text-[10px] text-primary">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        </Button>
      </div>

      {/* Document List Overlay */}
      {showDocList && (
        <div className="absolute z-10 left-0 top-11 w-60 bg-card border border-border rounded-lg shadow-xl p-1.5 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-medium text-muted-foreground">Documents</span>
            <Button variant="ghost" size="sm" onClick={createNewDoc} className="h-5 text-[10px] text-primary gap-1 px-1.5">
              <Plus className="h-2.5 w-2.5" /> New
            </Button>
          </div>
          {documents.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/50 px-2 py-2 text-center">No documents yet</p>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setActiveDoc(doc);
                  setDocContent(doc.content);
                  setDocTitle(doc.title);
                  setShowDocList(false);
                }}
                className={cn(
                  'w-full text-left px-2 py-1.5 rounded text-[11px] hover:bg-secondary transition-colors',
                  activeDoc?.id === doc.id && 'bg-primary/10 text-primary'
                )}
              >
                {doc.title}
              </button>
            ))
          )}
        </div>
      )}

      {/* Title */}
      <div className="px-3 pt-2 pb-0 shrink-0">
        <Input
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="Document Title"
          className="border-0 bg-transparent text-sm font-semibold focus-visible:ring-0 px-0 placeholder:text-muted-foreground/30 h-7"
        />
      </div>

      {/* Editor + AI Panel */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <Textarea
            id="doc-editor"
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            placeholder="Start writing here... Ask the AI assistant for help."
            className="h-full border-0 bg-transparent resize-none rounded-none focus-visible:ring-0 px-3 py-2 text-[13px] leading-relaxed placeholder:text-muted-foreground/30 font-mono"
          />
        </div>

        {/* AI Assistant Panel (toggleable) */}
        {showChat && (
          <div className="w-64 sm:w-72 flex flex-col border-l border-border bg-sidebar/30 shrink-0">
            <div className="px-2 py-1.5 border-b border-border flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-medium text-foreground">AI Assistant</span>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatMessages([])}
                className="h-5 text-[9px] text-muted-foreground px-1.5"
              >
                Clear
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 min-h-0">
              {chatMessages.length === 0 && (
                <div className="space-y-2 py-3">
                  <div className="text-center">
                    <Sparkles className="h-5 w-5 text-primary/40 mx-auto mb-1.5" />
                    <p className="text-[10px] text-muted-foreground">Ask me to help write, edit, or improve your document, Sir.</p>
                  </div>
                  {[
                    'Write an introduction',
                    'Improve writing style',
                    'Generate a summary',
                    'Add more details',
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setChatInput(prompt)}
                      className="w-full text-left text-[10px] text-muted-foreground hover:text-foreground p-1.5 rounded-md border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <Wand2 className="h-2.5 w-2.5 text-primary/40 mb-0.5 inline mr-0.5" />
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {chatMessages.map((msg) => (
                <div key={msg.id} className={cn('text-[11px]', msg.role === 'user' ? 'text-right' : '')}>
                  <div
                    className={cn(
                      'inline-block rounded-lg px-2.5 py-1.5 max-w-[95%]',
                      msg.role === 'user'
                        ? 'bg-primary/15 text-foreground'
                        : 'bg-card border border-border'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="markdown-content prose-invert text-[11px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        <button
                          onClick={() => handleApplyToDoc(msg.content)}
                          className="mt-1.5 text-[9px] text-primary hover:underline"
                        >
                          Apply to document
                        </button>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && streamingContent && (
                <div className="text-[11px]">
                  <div className="inline-block rounded-lg px-2.5 py-1.5 max-w-[95%] bg-card border border-border">
                    <div className="markdown-content prose-invert text-[11px]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                    </div>
                    <span className="typing-cursor" />
                  </div>
                </div>
              )}

              {isStreaming && !streamingContent && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  <span>Writing...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-2 border-t border-border shrink-0">
              <div className="flex gap-1">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask the AI..."
                  className="h-8 text-[12px] bg-card border-border"
                  disabled={isStreaming}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isStreaming}
                  size="icon"
                  className="h-8 w-8 bg-primary hover:bg-primary/90 rounded-lg shrink-0"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
