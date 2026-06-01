'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Send, Mic, MicOff, Square } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  isListening: boolean
  isThinking: boolean
  isSpeaking: boolean
  onToggleListening: () => void
}

export function ChatInput({
  onSend,
  isListening,
  isThinking,
  isSpeaking,
  onToggleListening,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isThinking) return
    onSend(trimmed)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isDisabled = isThinking || isSpeaking

  return (
    <div className="px-4 pb-4 pt-2">
      <motion.div
        className="glass-input rounded-2xl p-2 flex items-end gap-2"
        animate={isListening ? { borderColor: 'rgba(255, 68, 68, 0.5)', boxShadow: '0 0 30px rgba(255, 68, 68, 0.15)' } : {}}
      >
        {/* Mic button */}
        <motion.button
          onClick={onToggleListening}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isListening
              ? 'bg-red-500/20 text-red-400'
              : 'bg-white/5 text-white/40 hover:text-cyan-400 hover:bg-white/10'
          }`}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening...'
              : isThinking
                ? 'JARVIS is thinking...'
                : 'Ask JARVIS anything...'
          }
          disabled={isDisabled}
          rows={1}
          className="flex-1 bg-transparent text-white/90 placeholder:text-white/25 text-sm resize-none outline-none min-h-[40px] max-h-[120px] py-2"
        />

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={!input.trim() || isDisabled}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            input.trim() && !isDisabled
              ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.2)]'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
          whileTap={input.trim() && !isDisabled ? { scale: 0.9 } : {}}
          whileHover={input.trim() && !isDisabled ? { scale: 1.05 } : {}}
        >
          {isThinking ? (
            <Square className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}
