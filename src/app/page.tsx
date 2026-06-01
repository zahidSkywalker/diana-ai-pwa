'use client';

import { useState, useEffect, useRef, useCallback, type FormEvent, type DragEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Send,
  Paperclip,
  X,
  Menu,
  Search,
  Trash2,
  Bot,
  User,
  FileText,
  Image as ImageIcon,
  Film,
  Loader2,
  Square,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDianaChat, type Message, type Attachment, type Conversation } from '@/hooks/useDianaChat';
import { formatDistanceToNow } from 'date-fns';

// ─── File type helpers ──────────────────────────────────────────
function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Film;
  return FileText;
}

function getFileCategory(type: string): 'image' | 'video' | 'document' {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  return 'document';
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Attachment Display ─────────────────────────────────────────
// ─── FileIconWrapper to avoid rendering component during render ─────
function FileIconWrapper({ IconComponent, classNameOverride }: { IconComponent: React.ComponentType<{ className?: string }>; classNameOverride?: string }) {
  return <IconComponent className={classNameOverride || 'h-4 w-4 text-primary'} />;
}

function AttachmentDisplay({ attachment }: { attachment: Attachment }) {
  const category = getFileCategory(attachment.type);
  const FileIcon = getFileIcon(attachment.type);

  if (category === 'image') {
    return (
      <div className="mb-2">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-w-xs rounded-lg border border-border/50 cursor-pointer hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </div>
    );
  }

  if (category === 'video') {
    return (
      <div className="mb-2">
        <video
          src={attachment.url}
          controls
          className="max-w-xs rounded-lg border border-border/50"
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors mb-2 text-sm"
    >
      <FileIconWrapper IconComponent={FileIcon} />
      <span className="text-foreground/90">{attachment.name}</span>
      <span className="text-muted-foreground text-xs">({formatFileSize(attachment.size)})</span>
    </a>
  );
}

// ─── Chat Message ───────────────────────────────────────────────
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  let parsedAttachments: Attachment[] = [];
  try {
    parsedAttachments = JSON.parse(message.attachments || '[]');
  } catch { /* empty */ }

  const timeStr = message.createdAt
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 px-4 py-3 group',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col max-w-[75%] md:max-w-[65%]', isUser ? 'items-end' : 'items-start')}>
        {/* Name & time */}
        <div className={cn('flex items-center gap-2 mb-1', isUser ? 'flex-row-reverse' : '')}>
          <span className="text-xs font-semibold text-foreground/80">
            {isUser ? 'You' : 'Diana AI'}
          </span>
          <span className="text-[10px] text-muted-foreground">{timeStr}</span>
        </div>

        {/* Attachments */}
        {parsedAttachments.length > 0 && (
          <div className={cn('flex flex-wrap gap-2 mb-2', isUser ? 'justify-end' : '')}>
            {parsedAttachments.map((att, i) => (
              <AttachmentDisplay key={i} attachment={att} />
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-xl px-4 py-2.5',
            isUser
              ? 'bg-primary/15 border border-primary/20'
              : 'bg-card border border-border/50'
          )}
        >
          <div className={cn(
            'markdown-content text-sm leading-relaxed',
            isUser ? 'text-foreground' : 'text-foreground/95'
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ──────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex gap-3 px-4 py-3"
    >
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
        <Bot className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-card border border-border/50">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-muted-foreground ml-1">Diana is thinking...</span>
      </div>
    </motion.div>
  );
}

// ─── Conversation Item ─────────────────────────────────────────
function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const lastMsg = conversation.messages?.[0];
  const preview = lastMsg ? lastMsg.content.slice(0, 60) : 'No messages yet';
  const time = conversation.createdAt
    ? formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })
    : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer transition-colors relative',
        isActive
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-secondary/50 border border-transparent'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate flex-1">{conversation.title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground truncate flex-1">{preview}</span>
        <span className="text-[10px] text-muted-foreground/70 ml-2 flex-shrink-0">{time}</span>
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────
function SidebarContent({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  searchQuery,
  onSearchChange,
  onClose,
}: {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onClose: () => void;
}) {
  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Diana AI</h1>
            <p className="text-[10px] text-muted-foreground">Advanced Assistant</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onClose}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-1 py-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              {conversations.length === 0 ? 'No conversations yet' : 'No matches found'}
            </div>
          ) : (
            filtered.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => onSelectConversation(conv)}
                onDelete={() => onDeleteConversation(conv.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Diana AI by Zahidul Islam
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function Home() {
  const {
    conversations,
    activeConversation,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    pendingAttachments,
    setActiveConversation,
    loadConversations,
    loadConversation,
    sendMessage,
    deleteConversation,
    stopStreaming,
    addPendingAttachment,
    removePendingAttachment,
    clearPendingAttachments,
  } = useDianaChat();

  const [inputText, setInputText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [inputText]);

  const handleNewChat = useCallback(() => {
    setActiveConversation(null);
    setSidebarOpen(false);
    clearPendingAttachments();
  }, [setActiveConversation, clearPendingAttachments]);

  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    setActiveConversation(conv);
    await loadConversation(conv.id);
    setSidebarOpen(false);
  }, [setActiveConversation, loadConversation]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
  }, [deleteConversation]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text && pendingAttachments.length === 0) return;
    if (isStreaming) return;

    setInputText('');
    clearPendingAttachments();

    await sendMessage(text, activeConversation?.id, pendingAttachments);
  }, [inputText, pendingAttachments, isStreaming, sendMessage, activeConversation, clearPendingAttachments]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const attachment: Attachment = {
        url: '',
        name: file.name,
        type: file.type,
        size: file.size,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        file: file,
      };
      addPendingAttachment(attachment);
    }
  }, [addPendingAttachment]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  }, []);

  return (
    <div className="h-screen h-[100dvh] flex overflow-hidden bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative z-50 lg:z-auto h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent
          conversations={conversations}
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">
                {activeConversation?.title || 'Diana AI'}
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {isStreaming ? 'Responding...' : activeConversation ? 'Chat active' : 'Start a new conversation'}
              </p>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="mb-6"
              >
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-4 glow-emerald">
                  <Sparkles className="h-10 w-10 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">Welcome to Diana AI</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Your advanced AI assistant. Ask me about coding, research, writing, analysis, or anything else.
                  Upload files for analysis.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {[
                  { icon: '💻', text: 'Help me write a Python script' },
                  { icon: '📝', text: 'Summarize this document for me' },
                  { icon: '🔍', text: 'Research quantum computing basics' },
                  { icon: '🧮', text: 'Solve this math problem step by step' },
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(suggestion.text);
                      textareaRef.current?.focus();
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-card border border-border/50 hover:bg-secondary/50 hover:border-primary/20 transition-colors text-left text-sm"
                  >
                    <span className="text-base">{suggestion.icon}</span>
                    <span className="text-muted-foreground text-xs truncate">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Streaming message */}
              {isStreaming && (
                <>
                  {streamingContent ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 px-4 py-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex flex-col max-w-[75%] md:max-w-[65%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground/80">Diana AI</span>
                        </div>
                        <div className="rounded-xl px-4 py-2.5 bg-card border border-border/50">
                          <div className="markdown-content text-sm leading-relaxed text-foreground/95">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {streamingContent}
                            </ReactMarkdown>
                          </div>
                          <span className="typing-cursor" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <TypingIndicator />
                  )}
                </>
              )}

              {/* Loading messages */}
              {isLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm safe-area-input">
          {/* Pending Attachments Preview */}
          <AnimatePresence>
            {pendingAttachments.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border/50"
              >
                <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
                  {pendingAttachments.map((att, i) => (
                    <div key={i} className="relative flex-shrink-0 group">
                      {att.preview ? (
                        <div className="relative">
                          <img
                            src={att.preview}
                            alt={att.name}
                            className="h-16 w-16 object-cover rounded-lg border border-border/50"
                          />
                          <button
                            onClick={() => removePendingAttachment(i)}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/50 text-xs">
                          <FileIconWrapper IconComponent={getFileIcon(att.type)} classNameOverride="h-3.5 w-3.5" />
                          <span className="text-foreground/80 max-w-[100px] truncate">{att.name}</span>
                          <button onClick={() => removePendingAttachment(i)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drag & Drop overlay */}
          <AnimatePresence>
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-primary/5 border-2 border-dashed border-primary/40 rounded-lg flex items-center justify-center pointer-events-none"
                style={{ margin: '8px' }}
              >
                <div className="text-center">
                  <Paperclip className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-primary font-medium">Drop files here</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 px-4 py-3"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                handleFileSelect(e.target.files);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-secondary/80 flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4.5 w-4.5 text-muted-foreground" />
            </Button>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? 'Diana is responding...' : 'Message Diana AI...'}
                disabled={isStreaming}
                rows={1}
                className="w-full resize-none rounded-xl bg-secondary/50 border border-border/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 disabled:opacity-50 transition-colors"
                style={{ maxHeight: '160px', minHeight: '40px' }}
              />
            </div>

            {/* Send / Stop Button */}
            {isStreaming ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex-shrink-0"
                onClick={stopStreaming}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-30 flex-shrink-0"
                disabled={!inputText.trim() && pendingAttachments.length === 0}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
