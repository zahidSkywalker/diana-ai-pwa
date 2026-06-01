'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquarePlus, Trash2, X, Cpu } from 'lucide-react'
import { useJarvisStore, type Conversation } from '@/store/jarvis-store'

interface SidebarProps {
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export function Sidebar({
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const {
    sidebarOpen,
    setSidebarOpen,
    conversations,
    activeConversationId,
  } = useJarvisStore()

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar panel */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-80 z-50 flex flex-col"
            style={{
              background: 'rgba(13, 17, 23, 0.95)',
              backdropFilter: 'blur(30px)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Sidebar header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-white/90 tracking-wide">
                  CONVERSATIONS
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors lg:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New chat button */}
            <div className="p-3">
              <motion.button
                onClick={() => {
                  onNewChat()
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/10"
                style={{ border: '1px solid rgba(0,212,255,0.2)' }}
                whileTap={{ scale: 0.97 }}
                whileHover={{ boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}
              >
                <MessageSquarePlus className="w-4 h-4" />
                New Conversation
              </motion.button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto jarvis-scrollbar px-2 pb-4">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-white/20 text-sm">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((convo: Conversation) => (
                    <motion.div
                      key={convo.id}
                      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        activeConversationId === convo.id
                          ? 'bg-cyan-500/10 border border-cyan-500/20'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                      onClick={() => {
                        onSelectConversation(convo.id)
                        setSidebarOpen(false)
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          activeConversationId === convo.id
                            ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.5)]'
                            : 'bg-white/20'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/80 truncate">{convo.title}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">
                          {new Date(convo.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(convo.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
