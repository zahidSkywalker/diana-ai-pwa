"use client";

import { characters } from "@/lib/characters";
import { CharacterCard } from "./CharacterCard";
import { getAllChatHistories } from "@/lib/storage";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface CharacterGridProps {
  onSelectCharacter: (characterId: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function CharacterGrid({ onSelectCharacter }: CharacterGridProps) {
  const chatHistories = getAllChatHistories();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-dark)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md border-b" style={{ borderColor: "var(--border)", background: "rgba(13,13,26,0.85)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gold)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "var(--bg-dark)" }} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-wide" style={{ color: "var(--gold)" }}>
                MythicMuse
              </h1>
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "var(--text-secondary)" }}>
                Where Fantasy Comes Alive
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero text */}
        <div className="text-center mb-8 sm:mb-10">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Choose Your Companion
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base max-w-lg mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Select a character to begin your adventure in a world of fantasy and wonder
          </motion.p>
        </div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {characters.map((character) => (
            <motion.div key={character.id} variants={item}>
              <CharacterCard
                character={character}
                onClick={() => onSelectCharacter(character.id)}
                messageCount={chatHistories[character.id]?.length || 0}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Crafted with magic and code ✨
          </p>
        </footer>
      </main>
    </div>
  );
}
