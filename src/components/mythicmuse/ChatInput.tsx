"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string, image?: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const removeImage = useCallback(() => {
    setImagePreview(null);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !imagePreview) return;
    if (isLoading || disabled) return;

    onSend(trimmed, imagePreview || undefined);
    setText("");
    setImagePreview(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, imagePreview, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  return (
    <div
      className="border-t px-3 sm:px-4 py-3"
      style={{
        borderColor: "var(--border)",
        background: "rgba(13, 13, 26, 0.95)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 relative inline-block"
          >
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 rounded-lg object-cover border"
              style={{ borderColor: "var(--border)" }}
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "var(--gold)", color: "var(--bg-dark)" }}
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div
        className="flex items-end gap-2 rounded-xl px-3 py-2"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "var(--text-secondary)" }}
          title="Upload image"
          disabled={disabled}
        >
          <ImagePlus className="w-5 h-5" />
        </button>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={disabled || isLoading}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm py-1.5 placeholder:text-[var(--text-muted)]"
          style={{
            color: "var(--text-primary)",
            maxHeight: "160px",
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || disabled || (!text.trim() && !imagePreview)}
          className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 disabled:opacity-30"
          style={{
            background: isLoading ? "var(--gold)" : "transparent",
            color: text.trim() || imagePreview ? "var(--gold)" : "var(--text-muted)",
          }}
          title="Send message"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      <p className="mt-1.5 text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
