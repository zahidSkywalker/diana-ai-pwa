"use client";

import { Character } from "@/lib/types";
import { CharacterAvatar } from "./CharacterAvatar";
import { motion } from "framer-motion";

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
  messageCount?: number;
}

export function CharacterCard({ character, onClick, messageCount = 0 }: CharacterCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative w-full text-left rounded-xl border border-[var(--border)] overflow-hidden transition-all duration-300 hover:border-[var(--gold)] hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)]"
      style={{
        background: "var(--card-bg)",
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${character.avatarColor}08, transparent)`,
        }}
      />

      {/* Avatar section */}
      <div
        className="relative pt-6 pb-4 flex justify-center"
        style={{
          background: `linear-gradient(180deg, ${character.avatarColor}10, transparent)`,
        }}
      >
        <div className="relative">
          <CharacterAvatar character={character} size={72} />
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px]"
            style={{
              borderColor: "var(--card-bg)",
              background: character.avatarAccent,
              color: "#fff",
            }}
          >
            {character.species[0]}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="p-4 pt-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <h3
            className="text-sm font-bold tracking-wide"
            style={{ color: "var(--gold)" }}
          >
            {character.name}
          </h3>
          {messageCount > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                background: "var(--gold)",
                color: "var(--bg-dark)",
                fontWeight: 600,
              }}
            >
              {messageCount}
            </span>
          )}
        </div>

        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: character.avatarColor }}
        >
          {character.species}
        </p>

        <p
          className="text-xs leading-relaxed line-clamp-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {character.shortDescription}
        </p>
      </div>
    </motion.button>
  );
}
