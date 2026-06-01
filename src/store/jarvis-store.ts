import { create } from 'zustand'

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  conversationId: string
  createdAt: string
}

interface JarvisState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Message[]
  isListening: boolean
  isSpeaking: boolean
  isThinking: boolean
  sidebarOpen: boolean
  streamingContent: string

  setConversations: (conversations: Conversation[]) => void
  setActiveConversation: (id: string | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateStreamingContent: (content: string) => void
  setListening: (v: boolean) => void
  setSpeaking: (v: boolean) => void
  setThinking: (v: boolean) => void
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  clearMessages: () => void
}

export const useJarvisStore = create<JarvisState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isListening: false,
  isSpeaking: false,
  isThinking: false,
  sidebarOpen: false,
  streamingContent: '',

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateStreamingContent: (content) => set({ streamingContent: content }),

  setListening: (v) => set({ isListening: v }),

  setSpeaking: (v) => set({ isSpeaking: v }),

  setThinking: (v) => set({ isThinking: v }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  clearMessages: () => set({ messages: [], streamingContent: '' }),
}))
