"use client";

import { ChatMessage } from "@/lib/types";
import { motion } from "framer-motion";

interface MessageBubbleProps {
  message: ChatMessage;
  isLatest?: boolean;
}

export function MessageBubble({ message, isLatest = false }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-br-md"
            : "rounded-bl-md"
        }`}
        style={
          isUser
            ? {
                background: "var(--user-msg-bg)",
                border: "1px solid rgba(212, 175, 55, 0.2)",
              }
            : {
                background: "var(--char-msg-bg)",
                borderLeft: "3px solid var(--gold)",
                borderRight: "1px solid var(--border)",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }
        }
      >
        {/* Image */}
        {message.image && (
          <div className="mb-2 rounded-lg overflow-hidden">
            <img
              src={message.image}
              alt="Uploaded"
              className="max-w-full max-h-48 rounded-lg object-cover"
            />
          </div>
        )}

        {/* Text content */}
        <div
          className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isLatest && !isUser ? "animate-pulse-subtle" : ""
          }`}
          style={{
            color: isUser ? "var(--text-primary)" : "var(--text-primary)",
          }}
        >
          {message.content}
          {isLatest && !isUser && !message.content.endsWith("▊") && (
            <span className="inline-block w-2 h-4 ml-0.5 animate-pulse" style={{ background: "var(--gold)", verticalAlign: "text-bottom" }} />
          )}
        </div>

        {/* Timestamp */}
        <div
          className="mt-1.5 text-[10px] opacity-50"
          style={{ color: isUser ? "var(--text-secondary)" : "var(--text-muted)" }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}
