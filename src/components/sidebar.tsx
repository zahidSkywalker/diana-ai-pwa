'use client';

import { cn } from '@/lib/utils';
import { useAppStore, type Module } from '@/lib/store';
import {
  MessageSquare,
  PenTool,
  BookOpen,
  Database,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems: { id: Module; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-5 w-5" /> },
  { id: 'cowriter', label: 'Write', icon: <PenTool className="h-5 w-5" /> },
  { id: 'books', label: 'Books', icon: <BookOpen className="h-5 w-5" /> },
  { id: 'knowledge', label: 'Know', icon: <Database className="h-5 w-5" /> },
  { id: 'space', label: 'Space', icon: <LayoutDashboard className="h-5 w-5" /> },
];

const bottomNavItems: { id: Module; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-[18px] w-[18px]" /> },
  { id: 'cowriter', label: 'Write', icon: <PenTool className="h-[18px] w-[18px]" /> },
  { id: 'books', label: 'Books', icon: <BookOpen className="h-[18px] w-[18px]" /> },
  { id: 'knowledge', label: 'Know', icon: <Database className="h-[18px] w-[18px]" /> },
  { id: 'space', label: 'Space', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
];

export function Sidebar() {
  const { activeModule, sidebarOpen, setActiveModule, setSidebarOpen } = useAppStore();

  const handleNav = (id: Module) => {
    setActiveModule(id);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col h-full w-14 xl:w-56 bg-sidebar border-r border-sidebar-border shrink-0 transition-all duration-200">
        {/* Logo */}
        <div className="flex items-center gap-3 h-12 px-3 xl:px-4 border-b border-sidebar-border shrink-0">
          <img
            src="/jarvis-logo.png"
            alt="JARVIS"
            className="w-8 h-8 rounded-lg glow-emerald shrink-0"
          />
          <div className="hidden xl:block">
            <h1 className="text-sm font-bold tracking-widest text-foreground">JARVIS</h1>
            <p className="text-[9px] text-muted-foreground tracking-wider uppercase">AI Assistant</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 xl:px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                title={item.label}
                className={cn(
                  'w-full flex items-center gap-3 px-2.5 xl:px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-primary/15 text-primary glow-emerald'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                )}
              >
                <span className={cn(
                  'transition-colors duration-200 shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}>
                  {item.icon}
                </span>
                <span className="hidden xl:inline">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto hidden xl:block w-1.5 h-1.5 rounded-full bg-primary pulse-ring"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 xl:px-3 py-3 border-t border-sidebar-border shrink-0">
          <div className="hidden xl:block glass rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Powered by AI</p>
            <p className="text-[9px] text-muted-foreground/60 mt-0.5">For Sir Zahidul Islam</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-lg border-t border-sidebar-border safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {bottomNavItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center rounded-lg transition-all duration-200',
                  isActive ? 'bg-primary/15 p-1.5 glow-emerald' : 'p-1.5'
                )}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile overlay sidebar (legacy, kept for future use if needed) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
