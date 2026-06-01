import { create } from 'zustand';

export type Module = 'chat' | 'cowriter' | 'books' | 'knowledge' | 'space';
export type ChatMode = 'chat' | 'solve' | 'quiz' | 'research' | 'visualize';

interface AppState {
  activeModule: Module;
  sidebarOpen: boolean;
  chatMode: ChatMode;
  activeConversationId: string | null;
  activeDocumentId: string | null;
  activeBookId: string | null;
  activeChapterIndex: number;

  setActiveModule: (module: Module) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setChatMode: (mode: ChatMode) => void;
  setActiveConversationId: (id: string | null) => void;
  setActiveDocumentId: (id: string | null) => void;
  setActiveBookId: (id: string | null) => void;
  setActiveChapterIndex: (index: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'chat',
  sidebarOpen: false,
  chatMode: 'chat',
  activeConversationId: null,
  activeDocumentId: null,
  activeBookId: null,
  activeChapterIndex: 0,

  setActiveModule: (module) => set({ activeModule: module, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setChatMode: (mode) => set({ chatMode: mode }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setActiveDocumentId: (id) => set({ activeDocumentId: id }),
  setActiveBookId: (id) => set({ activeBookId: id }),
  setActiveChapterIndex: (index) => set({ activeChapterIndex: index }),
}));
