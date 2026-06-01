"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Character, ChatMessage } from "@/lib/types";
import { characters } from "@/lib/characters";
import { saveChatHistory, loadChatHistory, clearChatHistory } from "@/lib/storage";
import { CharacterAvatar } from "./CharacterAvatar";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatViewProps {
  characterId: string;
  onBack: () => void;
}

export function ChatView({ characterId, onBack }: ChatViewProps) {
  const character = characters.find((c) => c.id === characterId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory(characterId);
    if (history.length === 0 && character) {
      // Add greeting as first message
      const greetingMsg: ChatMessage = {
        id: `greeting-${Date.now()}`,
        role: "assistant",
        content: character.greeting,
        timestamp: Date.now(),
      };
      setMessages([greetingMsg]);
      saveChatHistory(characterId, [greetingMsg]);
    } else {
      setMessages(history);
    }
  }, [characterId, character]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamResponse = useCallback(
    async (userMessage: string, image?: string) => {
      if (!character) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userMessage,
        image,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsStreaming(true);

      // Build API messages
      const apiMessages: { role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }[] = [
        { role: "system", content: character.systemPrompt },
      ];

      for (const msg of updatedMessages) {
        if (msg.role === "system") continue;

        if (msg.image) {
          apiMessages.push({
            role: msg.role,
            content: [
              { type: "text", text: msg.content },
              { type: "image_url", image_url: { url: msg.image } },
            ],
          });
        } else {
          apiMessages.push({ role: msg.role, content: msg.content });
        }
      }

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        const newMessages = [...updatedMessages, assistantMsg];
        setMessages(newMessages);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                const lastMsg = { ...newMessages[newMessages.length - 1], content: accumulated };
                setMessages((prev) => [...prev.slice(0, -1), lastMsg]);
              }
            } catch {
              // skip
            }
          }
        }

        // Save final state
        const finalMessages = [...updatedMessages, { ...assistantMsg, content: accumulated }];
        setMessages(finalMessages);
        saveChatHistory(characterId, finalMessages);
      } catch (error) {
        console.error("Stream error:", error);
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "*A mysterious force disrupts the connection... Please try again.*",
          timestamp: Date.now(),
        };
        const errorMessages = [...updatedMessages, errorMsg];
        setMessages(errorMessages);
        saveChatHistory(characterId, errorMessages);
      } finally {
        setIsStreaming(false);
      }
    },
    [character, characterId, messages]
  );

  const handleSend = useCallback(
    (text: string, image?: string) => {
      streamResponse(text, image);
    },
    [streamResponse]
  );

  const handleClearChat = useCallback(() => {
    clearChatHistory(characterId);
    if (character) {
      const greetingMsg: ChatMessage = {
        id: `greeting-${Date.now()}`,
        role: "assistant",
        content: character.greeting,
        timestamp: Date.now(),
      };
      setMessages([greetingMsg]);
      saveChatHistory(characterId, [greetingMsg]);
    }
    setShowClearConfirm(false);
  }, [characterId, character]);

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-dark)" }}>
        <p style={{ color: "var(--text-secondary)" }}>Character not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-dark)" }}>
      {/* Chat header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-3 border-b"
        style={{
          borderColor: "var(--border)",
          background: "rgba(13, 13, 26, 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--text-secondary)" }}
            title="Back to characters"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <CharacterAvatar character={character} size={36} />
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--gold)" }}>
                {character.name}
              </h2>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: character.avatarColor }}>
                {character.species}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 mr-2"
            >
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--gold)" }} />
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Writing...</span>
            </motion.div>
          )}
          <div className="relative">
            <button
              onClick={() => setShowClearConfirm(!showClearConfirm)}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showClearConfirm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  className="absolute right-0 top-10 z-20 p-3 rounded-lg shadow-xl border min-w-[160px]"
                  style={{
                    background: "var(--card-bg)",
                    borderColor: "var(--border)",
                  }}
                >
                  <p className="text-xs mb-2" style={{ color: "var(--text-primary)" }}>
                    Clear this conversation?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearChat}
                      className="text-xs px-3 py-1 rounded-md font-medium"
                      style={{ background: "var(--gold)", color: "var(--bg-dark)" }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="text-xs px-3 py-1 rounded-md"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLatest={index === messages.length - 1 && isStreaming}
            />
          ))}

          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start mb-4"
            >
              <div
                className="rounded-2xl rounded-bl-md px-4 py-3"
                style={{
                  background: "var(--char-msg-bg)",
                  borderLeft: "3px solid var(--gold)",
                  borderRight: "1px solid var(--border)",
                  borderTop: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--gold)", animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--gold)", animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--gold)", animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        isLoading={isStreaming}
      />
    </div>
  );
}
