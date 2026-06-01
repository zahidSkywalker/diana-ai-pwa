'use client'

import { motion } from 'framer-motion'
import { Menu, Wifi, WifiOff, Settings } from 'lucide-react'

interface StatusBarProps {
  onToggleSidebar: () => void
  isOnline: boolean
}

export function StatusBar({ onToggleSidebar, isOnline }: StatusBarProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between px-4 py-3 border-b border-white/5"
      style={{
        background: 'rgba(10, 10, 26, 0.8)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={onToggleSidebar}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <h1 className="text-lg font-bold tracking-[0.2em] jarvis-text-glow text-cyan-400">
              JARVIS
            </h1>
            {/* Subtle underline glow */}
            <motion.div
              className="absolute -bottom-0.5 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <span className="text-[10px] text-white/20 tracking-widest hidden sm:inline">
            PERSONAL ASSISTANT
          </span>
        </div>
      </div>

      {/* Right: Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
            )}
          </motion.div>
          <span className="text-[10px] text-white/30 hidden sm:inline">
            {isOnline ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        <motion.button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Settings className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.header>
  )
}
