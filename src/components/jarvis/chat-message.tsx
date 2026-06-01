'use client'

import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  isStreaming?: boolean
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  if (role === 'system') return null

  const isUser = role === 'user'
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
          isUser
            ? 'bg-white/10 border border-white/20'
            : 'border border-cyan-500/30'
        }`}
        style={
          !isUser
            ? {
                background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.05) 100%)',
                boxShadow: '0 0 15px rgba(0,212,255,0.15)',
              }
            : undefined
        }
      >
        {isUser ? (
          <User className="w-4 h-4 text-white/70" />
        ) : (
          <Bot className="w-4 h-4 text-cyan-400" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'glass-strong rounded-tr-sm'
            : 'glass jarvis-border-glow rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="text-white/90 whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="jarvis-markdown text-white/85">
            <ReactMarkdown>{content}</ReactMarkdown>
            {isStreaming && (
              <motion.span
                className="inline-block w-2 h-4 ml-1 rounded-sm bg-cyan-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </div>
        )}
        <div
          className={`text-[10px] mt-1.5 ${isUser ? 'text-right text-white/30' : 'text-white/25'}`}
        >
          {time}
        </div>
      </div>
    </motion.div>
  )
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 items-start"
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-cyan-500/30"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.05) 100%)',
          boxShadow: '0 0 15px rgba(0,212,255,0.15)',
        }}
      >
        <Bot className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-cyan-400"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
