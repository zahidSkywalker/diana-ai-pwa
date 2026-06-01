'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Plus,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  Sparkles,
  Layers,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Book {
  id: string;
  title: string;
  topic: string;
  progress: number;
  createdAt: string;
  chapters: Chapter[];
}

export function BooksModule() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [newTopic, setNewTopic] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      setBooks(data);
    } catch (error) {
      console.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const generateBook = async () => {
    if (!newTopic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: newTopic.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate book');
      }

      const book = await res.json();
      setBooks((prev) => [book, ...prev]);
      setActiveBook(book);
      setActiveChapter(0);
      setNewTopic('');
      setShowCreate(false);
    } catch (error: any) {
      alert(error.message || 'Failed to generate book. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const deleteBook = async (id: string) => {
    await fetch(`/api/books?id=${id}`, { method: 'DELETE' });
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (activeBook?.id === id) {
      setActiveBook(null);
    }
  };

  const updateProgress = (bookId: string, chapterIndex: number) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    const newProgress = Math.round(((chapterIndex + 1) / book.chapters.length) * 100);
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, progress: Math.max(b.progress, newProgress) } : b))
    );
    if (activeBook?.id === bookId) {
      setActiveBook((prev) => prev ? { ...prev, progress: Math.max(prev.progress, newProgress) } : null);
    }
  };

  const goNextChapter = () => {
    if (!activeBook) return;
    if (activeChapter < activeBook.chapters.length - 1) {
      const next = activeChapter + 1;
      setActiveChapter(next);
      updateProgress(activeBook.id, next);
    }
  };

  const goPrevChapter = () => {
    if (activeChapter > 0) setActiveChapter(activeChapter - 1);
  };

  // Book Reading View
  if (activeBook) {
    const chapter = activeBook.chapters[activeChapter];
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setActiveBook(null)} className="h-7 w-7 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold truncate">{activeBook.title}</h3>
            <p className="text-[9px] text-muted-foreground">
              Ch. {activeChapter + 1}/{activeBook.chapters.length}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 w-24">
            <Progress value={activeBook.progress} className="h-1" />
            <span className="text-[9px] text-muted-foreground">{activeBook.progress}%</span>
          </div>
        </div>

        {/* Chapter Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4">
            <div className="mb-4">
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Chapter {activeChapter + 1}
              </span>
              <h2 className="text-base sm:text-lg font-bold mt-1.5">{chapter?.title}</h2>
            </div>

            {chapter && (
              <div className="markdown-content prose-invert text-[13px]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{chapter.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Chapter Navigation */}
        <div className="border-t border-border px-3 py-2 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrevChapter}
            disabled={activeChapter === 0}
            className="gap-1 text-[11px] h-8"
          >
            <ChevronLeft className="h-3 w-3" />
            Prev
          </Button>

          <div className="hidden sm:flex items-center gap-1">
            {activeBook.chapters.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveChapter(i);
                  updateProgress(activeBook.id, i);
                }}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === activeChapter
                    ? 'bg-primary w-5'
                    : i <= activeBook.progress / (100 / activeBook.chapters.length)
                      ? 'bg-primary/40'
                      : 'bg-border'
                )}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goNextChapter}
            disabled={activeChapter === activeBook.chapters.length - 1}
            className="gap-1 text-[11px] h-8"
          >
            Next
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Book List View
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2.5 border-b border-border flex items-center gap-2 shrink-0">
        <div className="flex-1">
          <h3 className="text-xs font-semibold">Learning Books</h3>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(!showCreate)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 text-[11px] h-7 px-2.5 glow-emerald"
        >
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">New Book</span>
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="px-3 py-2 border-b border-border bg-card/50 shrink-0">
          <div className="flex gap-1.5">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateBook()}
              placeholder="Enter a topic..."
              className="text-[13px] bg-background h-8"
              disabled={generating}
            />
            <Button
              onClick={generateBook}
              disabled={!newTopic.trim() || generating}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 text-[11px] h-8 px-2.5 shrink-0"
            >
              {generating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {generating ? '...' : 'Go'}
            </Button>
          </div>
          {generating && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Loader2 className="h-2.5 w-2.5 text-primary animate-spin" />
              <span className="text-[9px] text-muted-foreground">
                Generating with AI, Sir... This may take a moment.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Books List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary/40" />
              </div>
              <div className="text-center">
                <h4 className="text-xs font-medium text-foreground">No books yet, Sir</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Create a new learning book on any topic
                </p>
              </div>
            </div>
          ) : (
            books.map((book) => (
              <div
                key={book.id}
                className="group rounded-lg border border-border hover:border-primary/30 bg-card p-3 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setActiveBook(book);
                  setActiveChapter(0);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate">{book.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{book.topic}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground">{book.chapters.length} chapters</span>
                      <div className="flex items-center gap-1 flex-1 max-w-24">
                        <Progress value={book.progress} className="h-1" />
                        <span className="text-[9px] text-muted-foreground">{book.progress}%</span>
                      </div>
                      {book.progress >= 100 && (
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBook(book.id);
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
