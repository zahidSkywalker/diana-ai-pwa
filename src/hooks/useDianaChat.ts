'use client';

import { useState, useCallback, useRef } from 'react';

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  file?: File;
}

export interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  attachments: string; // JSON string
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  mode: string;
  createdAt: string;
  messages: Message[];
}

export function useDianaChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data: Message[] = await res.json();
      setMessages(data);
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setActiveConversation(conv);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversations]);

  const createConversation = useCallback(async (
    firstMessage: string,
    attachments: Attachment[] = []
  ): Promise<string> => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: firstMessage,
        attachments: attachments.map(a => ({ url: a.url, name: a.name, type: a.type, size: a.size })),
      }),
    });
    const conv: Conversation = await res.json();

    // Reload conversations list
    await loadConversations();
    setActiveConversation(conv);

    // The server already created the user message; load messages
    const msgRes = await fetch(`/api/conversations/${conv.id}/messages`);
    const msgs: Message[] = await msgRes.json();
    setMessages(msgs);

    return conv.id;
  }, [loadConversations]);

  const uploadFiles = useCallback(async (files: File[]): Promise<Attachment[]> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (!data.files) throw new Error('Upload failed');
    return data.files.map((f: { url: string; name: string; type: string; size: number }) => ({
      ...f,
      preview: f.type.startsWith('image/') ? f.url : undefined,
    }));
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    conversationId?: string,
    attachments: Attachment[] = []
  ) => {
    let convId = conversationId || activeConversation?.id;

    // Upload attachments first
    let uploadedAttachments: Attachment[] = [];
    const pendingFiles = attachments.filter(a => a.file);
    if (pendingFiles.length > 0) {
      uploadedAttachments = await uploadFiles(pendingFiles.map(a => a.file!));
    }
    // Combine already uploaded + newly uploaded
    const allAttachments = [
      ...attachments.filter(a => !a.file),
      ...uploadedAttachments,
    ];

    // Create new conversation if needed
    if (!convId) {
      convId = await createConversation(content, allAttachments);
      // Now stream the AI response
      await streamAIResponse(content, convId, allAttachments);
      return;
    }

    // Save user message
    await fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'user',
        content,
        attachments: allAttachments.map(a => ({ url: a.url, name: a.name, type: a.type, size: a.size })),
      }),
    });

    // Add user message to UI
    const userMsg: Message = {
      id: `local-${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content,
      attachments: JSON.stringify(allAttachments),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Stream AI response
    await streamAIResponse(content, convId, allAttachments);
  }, [activeConversation, createConversation, uploadFiles]);

  const streamAIResponse = useCallback(async (
    userContent: string,
    convId: string,
    _attachments: Attachment[] = []
  ) => {
    setIsStreaming(true);
    setStreamingContent('');

    // Build message history for context
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: userContent });

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: abortController.signal,
      });

      if (!res.ok || !res.body) throw new Error('Chat request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch {
              // skip
            }
          }
        }
      }

      // Save assistant message to DB
      const saveRes = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'assistant', content: fullContent }),
      });
      const savedMsg = await saveRes.json();

      // Add to messages list
      const assistantMsg: Message = {
        id: savedMsg.id || `local-${Date.now()}`,
        conversationId: convId,
        role: 'assistant',
        content: fullContent,
        attachments: '[]',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Update conversation title if it's the default
      const conv = conversations.find(c => c.id === convId);
      if (conv && conv.title === 'New Conversation') {
        const title = userContent.slice(0, 50) + (userContent.length > 50 ? '...' : '');
        await fetch(`/api/conversations/${convId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });
        // Reload conversations to get updated title
        loadConversations();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled
      } else {
        console.error('Stream error:', err);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortRef.current = null;
    }
  }, [messages, conversations, loadConversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    await fetch('/api/conversations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: conversationId }),
    });

    if (activeConversation?.id === conversationId) {
      setActiveConversation(null);
      setMessages([]);
    }
    await loadConversations();
  }, [activeConversation, loadConversations]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const addPendingAttachment = useCallback((attachment: Attachment) => {
    setPendingAttachments(prev => [...prev, attachment]);
  }, []);

  const removePendingAttachment = useCallback((index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearPendingAttachments = useCallback(() => {
    setPendingAttachments([]);
  }, []);

  return {
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
    uploadFiles,
  };
}
