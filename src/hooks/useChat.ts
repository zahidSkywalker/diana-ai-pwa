'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ChatSession,
  ChatMessage,
  AIModel,
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  generateId,
  createNewSession,
} from '@/lib/hexagon-types';

const STORAGE_KEY = 'hexagon-ai-sessions';
const ACTIVE_KEY = 'hexagon-ai-active-session';
const MODEL_KEY = 'hexagon-ai-selected-model';

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage full or unavailable
  }
}

function loadActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveSessionId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

function loadSelectedModel(): string {
  if (typeof window === 'undefined') return DEFAULT_MODEL;
  return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL;
}

function saveSelectedModel(model: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODEL_KEY, model);
}

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>(AVAILABLE_MODELS);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialized = useRef(false);

  // Initialize from localStorage
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const loadedSessions = loadSessions();
    setSessions(loadedSessions);
    setActiveSessionId(loadActiveSessionId());
    setSelectedModel(loadSelectedModel());

    // Fetch available models
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        if (data.models) setModels(data.models);
      })
      .catch(() => {
        // Use default models
      });
  }, []);

  // Persist sessions
  useEffect(() => {
    if (initialized.current) {
      saveSessions(sessions);
    }
  }, [sessions]);

  // Persist active session
  useEffect(() => {
    if (initialized.current) {
      saveActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  // Persist model selection
  useEffect(() => {
    if (initialized.current) {
      saveSelectedModel(selectedModel);
    }
  }, [selectedModel]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  const createSession = useCallback(() => {
    const session = createNewSession(selectedModel);
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setError(null);
    return session;
  }, [selectedModel]);

  const selectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setError(null);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        if (activeSessionId === id) {
          setActiveSessionId(updated.length > 0 ? updated[0].id : null);
        }
        return updated;
      });
    },
    [activeSessionId],
  );

  const renameSession = useCallback((id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s,
      ),
    );
  }, []);

  const updateModel = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    // Update active session's model
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, model: modelId, updatedAt: Date.now() } : s,
        ),
      );
    }
  }, [activeSessionId]);

  const generateTitle = useCallback((userMessage: string, aiMessage: string): string => {
    // Create a title from the first message
    const text = userMessage || aiMessage;
    const cleaned = text
      .replace(/[#*`_\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length <= 40) return cleaned;
    return cleaned.substring(0, 40) + '...';
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      setError(null);

      // Create or use existing session
      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = createSession();
        sessionId = session.id;
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      // Update session with user message
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const updatedMessages = [...s.messages, userMessage, aiMessage];
          const title = s.messages.length === 0 ? s.title : s.title;
          return {
            ...s,
            messages: updatedMessages,
            updatedAt: Date.now(),
            title: title === 'New Chat' ? '' : title,
          };
        }),
      );

      setIsLoading(true);

      // Prepare messages for API
      const currentSession = sessions.find((s) => s.id === sessionId);
      const historyMessages = [
        ...(currentSession?.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content },
      ].filter((m) => m.content.trim().length > 0);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historyMessages,
            model: selectedModel,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is not readable');

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;

                // Update the AI message with streaming content
                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id !== sessionId) return s;
                    return {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === aiMessage.id
                          ? { ...m, content: fullContent, isStreaming: true }
                          : m,
                      ),
                    };
                  }),
                );
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        // Finalize the message
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sessionId) return s;
            const newTitle =
              s.title === 'New Chat' || s.title === ''
                ? generateTitle(content, fullContent)
                : s.title;
            return {
              ...s,
              title: newTitle,
              messages: s.messages.map((m) =>
                m.id === aiMessage.id
                  ? { ...m, content: fullContent, isStreaming: false }
                  : m,
              ),
              updatedAt: Date.now(),
            };
          }),
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get AI response';
        setError(errorMessage);

        // Remove the empty AI message or show error
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === aiMessage.id
                  ? {
                      ...m,
                    content:
                      'Sorry, I encountered an error. Please try again.\n\n' +
                      `Error: ${errorMessage}`,
                    isStreaming: false,
                  }
                  : m,
              ),
            };
          }),
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [activeSessionId, createSession, generateTitle, selectedModel, sessions],
  );

  const clearChat = useCallback(() => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [], title: 'New Chat', updatedAt: Date.now() }
          : s,
      ),
    );
  }, [activeSessionId]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    // Finalize the streaming message
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.isStreaming ? { ...m, isStreaming: false } : m,
            ),
          };
        }),
      );
    }
  }, [activeSessionId]);

  return {
    sessions,
    activeSession,
    activeSessionId,
    selectedModel,
    models,
    isLoading,
    error,
    sendMessage,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    updateModel,
    clearChat,
    stopGeneration,
  };
}
