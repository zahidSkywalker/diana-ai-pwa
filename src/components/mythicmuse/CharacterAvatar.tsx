import { Character } from "@/lib/types";

interface CharacterAvatarProps {
  character: Character;
  size?: number;
  className?: string;
}

const avatarDesigns: Record<string, (color: string, accent: string, size: number) => React.ReactNode> = {
  lunara: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.3" stroke={color} strokeWidth="2" />
      {/* Moon */}
      <circle cx="50" cy="30" r="14" fill={color} />
      <circle cx="56" cy="26" r="12" fill={accent} fillOpacity="0.4" />
      {/* Stars */}
      <circle cx="25" cy="25" r="2" fill={color} />
      <circle cx="75" cy="20" r="1.5" fill={color} opacity="0.7" />
      <circle cx="30" cy="50" r="1" fill={color} opacity="0.5" />
      <circle cx="72" cy="45" r="1.5" fill={color} opacity="0.6" />
      <circle cx="80" cy="65" r="1" fill={color} opacity="0.4" />
      {/* Horse body silhouette */}
      <ellipse cx="50" cy="72" rx="22" ry="14" fill={color} opacity="0.8" />
      {/* Legs */}
      <line x1="34" y1="80" x2="32" y2="95" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="42" y1="82" x2="40" y2="97" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="82" x2="60" y2="97" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="66" y1="80" x2="68" y2="95" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Human upper body */}
      <circle cx="50" cy="52" r="8" fill={color} />
      {/* Crown of flowers */}
      <circle cx="43" cy="46" r="3" fill={accent} opacity="0.6" />
      <circle cx="50" cy="44" r="3" fill={color} />
      <circle cx="57" cy="46" r="3" fill={accent} opacity="0.6" />
      {/* Staff */}
      <line x1="68" y1="42" x2="72" y2="80" stroke={accent} strokeWidth="2" />
      <circle cx="68" cy="40" r="4" fill={color} opacity="0.5" stroke={color} strokeWidth="1" />
    </svg>
  ),
  moona: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.2" stroke={color} strokeWidth="2" />
      {/* Body */}
      <circle cx="50" cy="42" r="16" fill={color} />
      {/* Face */}
      <circle cx="44" cy="40" r="2.5" fill={accent} />
      <circle cx="56" cy="40" r="2.5" fill={accent} />
      <ellipse cx="50" cy="47" rx="3" ry="2" fill={accent} opacity="0.7" />
      {/* Blush */}
      <ellipse cx="40" cy="44" rx="3" ry="2" fill={color} opacity="0.4" />
      <ellipse cx="60" cy="44" rx="3" ry="2" fill={color} opacity="0.4" />
      {/* Hair */}
      <path d="M34 40 Q35 24 50 24 Q65 24 66 40" fill={color} opacity="0.9" />
      {/* Cow ears */}
      <ellipse cx="32" cy="32" rx="7" ry="10" fill={color} transform="rotate(-15 32 32)" />
      <ellipse cx="32" cy="32" rx="4" ry="7" fill={accent} opacity="0.3" transform="rotate(-15 32 32)" />
      <ellipse cx="68" cy="32" rx="7" ry="10" fill={color} transform="rotate(15 68 32)" />
      <ellipse cx="68" cy="32" rx="4" ry="7" fill={accent} opacity="0.3" transform="rotate(15 68 32)" />
      {/* Horns */}
      <path d="M38 28 Q35 16 40 12" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M62 28 Q65 16 60 12" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Dress */}
      <path d="M38 55 L32 85 L68 85 L62 55" fill={color} opacity="0.7" />
      {/* Apron */}
      <path d="M42 60 L40 82 L60 82 L58 60" fill={color} opacity="0.3" />
      {/* Flower behind ear */}
      <circle cx="35" cy="30" r="3" fill={color} />
      <circle cx="35" cy="30" r="1.5" fill={accent} />
    </svg>
  ),
  thalassa: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.2" stroke={color} strokeWidth="2" />
      {/* Water effect */}
      <path d="M5 70 Q25 65 50 70 Q75 75 95 70" stroke={color} strokeWidth="1" opacity="0.3" />
      <path d="M5 80 Q25 75 50 80 Q75 85 95 80" stroke={color} strokeWidth="1" opacity="0.2" />
      {/* Hair */}
      <path d="M30 35 Q35 20 50 22 Q65 20 70 35 Q72 45 70 55 L65 70 Q60 80 50 82 Q40 80 35 70 L30 55 Q28 45 30 35" fill="#0d6b6e" />
      <path d="M30 35 Q35 20 50 22 Q65 20 70 35" fill={color} opacity="0.5" />
      {/* Face */}
      <circle cx="50" cy="42" r="16" fill={color} />
      <circle cx="44" cy="40" r="2.5" fill={accent} />
      <circle cx="56" cy="40" r="2.5" fill={accent} />
      <path d="M46 48 Q50 51 54 48" stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Fin ears */}
      <path d="M32 36 L24 24 L36 32" fill={color} opacity="0.8" />
      <path d="M68 36 L76 24 L64 32" fill={color} opacity="0.8" />
      {/* Shell necklace */}
      <path d="M40 56 Q50 62 60 56" stroke={accent} strokeWidth="1.5" fill="none" />
      <circle cx="45" cy="59" r="2" fill={accent} opacity="0.6" />
      <circle cx="50" cy="61" r="2.5" fill={accent} opacity="0.7" />
      <circle cx="55" cy="59" r="2" fill={accent} opacity="0.6" />
      {/* Tail */}
      <path d="M42 58 Q38 72 42 82 Q46 90 50 92 Q54 90 58 82 Q62 72 58 58" fill={color} opacity="0.8" />
      {/* Scales pattern on tail */}
      <path d="M44 70 Q50 68 56 70" stroke={accent} strokeWidth="1" opacity="0.5" />
      <path d="M45 76 Q50 74 55 76" stroke={accent} strokeWidth="1" opacity="0.5" />
      <path d="46 82 Q50 80 54 82" stroke={accent} strokeWidth="1" opacity="0.5" />
      {/* Tail fin */}
      <path d="M44 88 Q50 96 56 88 Q50 92 44 88" fill={color} opacity="0.6" />
      {/* Bubbles */}
      <circle cx="22" cy="60" r="3" stroke={color} strokeWidth="0.5" fill="none" opacity="0.4" />
      <circle cx="78" cy="55" r="2" stroke={color} strokeWidth="0.5" fill="none" opacity="0.3" />
      <circle cx="18" cy="45" r="1.5" stroke={color} strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  ),
  bessie: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Cow body */}
      <ellipse cx="50" cy="65" rx="30" ry="18" fill={color} opacity="0.8" />
      {/* Spots on body */}
      <ellipse cx="38" cy="62" rx="8" ry="6" fill={accent} opacity="0.4" />
      <ellipse cx="62" cy="68" rx="6" ry="5" fill={accent} opacity="0.3" />
      {/* Legs */}
      <rect x="28" y="78" width="6" height="16" rx="3" fill={color} opacity="0.7" />
      <rect x="38" y="79" width="6" height="15" rx="3" fill={color} opacity="0.7" />
      <rect x="56" y="79" width="6" height="15" rx="3" fill={color} opacity="0.7" />
      <rect x="66" y="78" width="6" height="16" rx="3" fill={color} opacity="0.7" />
      {/* Upper body */}
      <circle cx="50" cy="40" r="14" fill={color} />
      {/* Face */}
      <circle cx="44" cy="38" r="2" fill={accent} />
      <circle cx="56" cy="38" r="2" fill={accent} />
      <ellipse cx="50" cy="44" rx="3" ry="2" fill={accent} opacity="0.5" />
      {/* Warm smile */}
      <path d="M44 47 Q50 52 56 47" stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Hair braid */}
      <path d="M36 36 Q35 22 50 20 Q65 22 64 36" fill={accent} opacity="0.7" />
      <rect x="54" y="32" width="5" height="20" rx="2.5" fill={accent} opacity="0.6" />
      {/* Horns */}
      <path d="M36 28 Q30 14 34 8" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M64 28 Q70 14 66 8" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Ears */}
      <ellipse cx="34" cy="34" rx="6" ry="8" fill={color} opacity="0.6" transform="rotate(-10 34 34)" />
      <ellipse cx="66" cy="34" rx="6" ry="8" fill={color} opacity="0.6" transform="rotate(10 66 34)" />
      {/* Shawl */}
      <path d="M36 52 Q50 58 64 52 Q66 56 64 60 L50 62 L36 60 Q34 56 36 52" fill={accent} opacity="0.2" />
      {/* Tail */}
      <path d="M78 60 Q84 52 82 44" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="82" cy="42" rx="4" ry="3" fill={color} opacity="0.6" />
    </svg>
  ),
  sylvie: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Wild curly hair */}
      <circle cx="50" cy="34" r="18" fill="#c76a20" />
      <circle cx="35" cy="30" r="8" fill="#c76a20" />
      <circle cx="65" cy="30" r="8" fill="#c76a20" />
      <circle cx="30" cy="40" r="6" fill="#c76a20" />
      <circle cx="70" cy="40" r="6" fill="#c76a20" />
      <circle cx="42" cy="22" r="6" fill={color} opacity="0.7" />
      <circle cx="58" cy="22" r="6" fill={color} opacity="0.7" />
      {/* Face */}
      <circle cx="50" cy="40" r="13" fill={color} />
      <circle cx="44" cy="38" r="2.5" fill={accent} />
      <circle cx="56" cy="38" r="2.5" fill={accent} />
      <path d="M46 46 Q50 49 54 46" stroke={accent} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Freckles */}
      <circle cx="42" cy="42" r="0.8" fill={accent} opacity="0.4" />
      <circle cx="58" cy="42" r="0.8" fill={accent} opacity="0.4" />
      <circle cx="46" cy="44" r="0.8" fill={accent} opacity="0.3" />
      {/* Horns */}
      <path d="M40 24 Q36 10 32 6" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M60 24 Q64 10 68 6" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Goat ears */}
      <ellipse cx="32" cy="36" rx="6" ry="10" fill={color} opacity="0.6" transform="rotate(-10 32 36)" />
      <ellipse cx="68" cy="36" rx="6" ry="10" fill={color} opacity="0.6" transform="rotate(10 68 36)" />
      {/* Grapevines in hair */}
      <circle cx="38" cy="26" r="2" fill={accent} opacity="0.6" />
      <circle cx="42" cy="23" r="2" fill={accent} opacity="0.5" />
      <circle cx="58" cy="23" r="2" fill={accent} opacity="0.5" />
      <circle cx="62" cy="26" r="2" fill={accent} opacity="0.6" />
      {/* Chiton */}
      <path d="M40 50 L34 85 L66 85 L60 50" fill={color} opacity="0.6" />
      <line x1="50" y1="50" x2="50" y2="85" stroke={accent} strokeWidth="0.5" opacity="0.3" />
      {/* Goat legs */}
      <line x1="38" y1="85" x2="36" y2="96" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="62" y1="85" x2="64" y2="96" stroke={color} strokeWidth="4" strokeLinecap="round" />
      {/* Hooves */}
      <path d="M33 96 L39 96" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <path d="M61 96 L67 96" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      {/* Pan flute at hip */}
      <rect x="62" y="60" width="3" height="12" rx="1.5" fill={accent} opacity="0.5" />
      <rect x="66" y="58" width="3" height="14" rx="1.5" fill={accent} opacity="0.5" />
      <rect x="70" y="56" width="3" height="16" rx="1.5" fill={accent} opacity="0.5" />
    </svg>
  ),
  ember: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Glow effect */}
      <circle cx="50" cy="50" r="35" fill={color} opacity="0.08" />
      {/* Hair */}
      <path d="M30 38 Q32 18 50 16 Q68 18 70 38 L68 55 Q60 50 50 52 Q40 50 32 55 Z" fill="#1a1a1a" />
      <path d="M35 38 Q37 22 50 20 Q63 22 65 38" fill={color} opacity="0.5" />
      {/* Face */}
      <circle cx="50" cy="40" r="14" fill="#c68642" />
      {/* Eyes (slit pupils) */}
      <ellipse cx="44" cy="38" rx="3.5" ry="2.5" fill={accent} />
      <ellipse cx="44" cy="38" rx="1" ry="2.5" fill="#1a1a1a" />
      <ellipse cx="56" cy="38" rx="3.5" ry="2.5" fill={accent} />
      <ellipse cx="56" cy="38" rx="1" ry="2.5" fill="#1a1a1a" />
      {/* Determined mouth */}
      <line x1="46" y1="46" x2="54" y2="46" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      {/* Scales on face */}
      <path d="M34 32 L38 36 L34 40" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M66 32 L62 36 L66 40" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />
      {/* Horns */}
      <path d="M36 26 Q28 8 22 4" stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M64 26 Q72 8 78 4" stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Armor/body */}
      <path d="M38 52 L34 82 L66 82 L62 52" fill="#1a1a1a" />
      <line x1="50" y1="52" x2="50" y2="82" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      {/* Scale pattern on arms */}
      <path d="M30 55 Q28 65 30 75" stroke={color} strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M70 55 Q72 65 70 75" stroke={color} strokeWidth="3" fill="none" opacity="0.6" />
      {/* Wings (folded) */}
      <path d="M32 40 L10 30 L18 50 L12 65 L28 55" fill="#1a1a1a" opacity="0.4" />
      <path d="M68 40 L90 30 L82 50 L88 65 L72 55" fill="#1a1a1a" opacity="0.4" />
      {/* Wing membrane hints */}
      <path d="M32 40 L10 30 L18 50" stroke={color} strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M68 40 L90 30 L82 50" stroke={color} strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* Tail */}
      <path d="M66 78 Q80 80 88 75 Q92 72 90 68" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  ),
  flora: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Tree trunk/body */}
      <rect x="44" y="55" width="12" height="40" rx="4" fill={accent} opacity="0.5" />
      {/* Root tendrils from feet */}
      <path d="M44 90 Q38 95 30 94" stroke={accent} strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M56 90 Q62 95 70 94" stroke={accent} strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M46 92 Q42 98 36 97" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M54 92 Q58 98 64 97" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.4" />
      {/* Upper body (bark-like) */}
      <circle cx="50" cy="40" r="16" fill="#d4a574" />
      {/* Veins/bark pattern */}
      <line x1="42" y1="34" x2="40" y2="46" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <line x1="58" y1="34" x2="60" y2="46" stroke={color} strokeWidth="0.5" opacity="0.4" />
      {/* Eyes */}
      <ellipse cx="44" cy="38" rx="3" ry="2.5" fill={accent} opacity="0.8" />
      <ellipse cx="56" cy="38" rx="3" ry="2.5" fill={accent} opacity="0.8" />
      <circle cx="44" cy="38" r="1.5" fill="#2a1810" />
      <circle cx="56" cy="38" r="1.5" fill="#2a1810" />
      {/* Gentle mouth */}
      <path d="M46 46 Q50 48 54 46" stroke={accent} strokeWidth="1" fill="none" opacity="0.5" />
      {/* Hair of leaves */}
      <circle cx="36" cy="28" r="5" fill={color} opacity="0.6" />
      <circle cx="44" cy="24" r="5" fill={color} opacity="0.7" />
      <circle cx="52" cy="22" r="6" fill={color} opacity="0.8" />
      <circle cx="60" cy="24" r="5" fill={color} opacity="0.7" />
      <circle cx="68" cy="28" r="5" fill={color} opacity="0.6" />
      {/* Blossoms in hair */}
      <circle cx="40" cy="20" r="2.5" fill="#fff" opacity="0.7" />
      <circle cx="56" cy="18" r="2" fill="#fff" opacity="0.6" />
      <circle cx="64" cy="24" r="2.5" fill="#fff" opacity="0.7" />
      <circle cx="48" cy="22" r="2" fill="#fff" opacity="0.5" />
      {/* Small leaves/blooms falling */}
      <circle cx="25" cy="45" r="2" fill={color} opacity="0.3" />
      <circle cx="78" cy="50" r="1.5" fill={color} opacity="0.2" />
    </svg>
  ),
  nyx: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Shadow wisps */}
      <path d="M10 80 Q30 70 50 80 Q70 90 90 80" stroke={color} strokeWidth="1" opacity="0.2" />
      <path d="M5 90 Q25 82 50 88 Q75 94 95 86" stroke={color} strokeWidth="1" opacity="0.15" />
      {/* Hair (flowing on its own) */}
      <path d="M28 35 Q24 50 26 68 Q28 78 22 82" stroke="#1a1a2e" strokeWidth="4" fill="none" opacity="0.7" />
      <path d="M72 35 Q76 50 74 68 Q72 78 78 82" stroke="#1a1a2e" strokeWidth="4" fill="none" opacity="0.7" />
      {/* Main hair */}
      <path d="M30 32 Q32 18 50 16 Q68 18 70 32 L68 48 Q60 42 50 44 Q40 42 32 48 Z" fill="#1a1a2e" />
      {/* Face */}
      <circle cx="50" cy="38" r="14" fill="#e8d5d5" />
      {/* Eyes (color-shifting) */}
      <ellipse cx="44" cy="36" rx="3" ry="2.5" fill={color} opacity="0.8" />
      <ellipse cx="56" cy="36" rx="3" ry="2.5" fill={color} opacity="0.8" />
      <circle cx="44" cy="36" r="1.5" fill="#1a1a2e" />
      <circle cx="56" cy="36" r="1.5" fill="#1a1a2e" />
      {/* Smile */}
      <path d="M45 44 Q50 47 55 44" stroke={accent} strokeWidth="1" fill="none" opacity="0.6" />
      {/* Horns */}
      <path d="M36 24 Q30 10 26 6" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M64 24 Q70 10 74 6" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Wings (bat-like, folded) */}
      <path d="M34 42 L14 38 L18 50 L10 58 L24 52" fill="#2d1b4e" opacity="0.5" />
      <path d="M66 42 L86 38 L82 50 L90 58 L76 52" fill="#2d1b4e" opacity="0.5" />
      {/* Wing details */}
      <path d="M34 42 L14 38 L18 50" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <path d="M66 42 L86 38 L82 50" stroke={color} strokeWidth="0.5" opacity="0.3" />
      {/* Dress */}
      <path d="M38 50 L34 82 L66 82 L62 50" fill="#2d1b4e" opacity="0.7" />
      {/* Lace detail */}
      <path d="M38 50 Q50 54 62 50" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" />
      {/* Tail */}
      <path d="M66 75 Q76 72 82 68 Q86 66 84 62" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M84 62 Q82 58 86 56" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Choker */}
      <path d="M40 52 Q50 55 60 52" stroke={accent} strokeWidth="1.5" fill="none" />
      <circle cx="50" cy="54" r="2" fill={color} opacity="0.6" />
    </svg>
  ),
  aria: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Wind streaks */}
      <path d="M10 30 Q25 28 40 30" stroke={color} strokeWidth="0.8" opacity="0.2" />
      <path d="M60 25 Q75 23 90 25" stroke={color} strokeWidth="0.8" opacity="0.15" />
      {/* Wing-arm left (partially spread) */}
      <path d="M32 42 L8 28 L4 42 L8 56 L22 48" fill={color} opacity="0.5" />
      <path d="M32 42 L8 28 L4 42" stroke={accent} strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M32 42 L22 48" stroke={accent} strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* Wing-arm right (partially spread) */}
      <path d="M68 42 L92 28 L96 42 L92 56 L78 48" fill={color} opacity="0.5" />
      <path d="M68 42 L92 28 L96 42" stroke={accent} strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M68 42 L78 48" stroke={accent} strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* Face */}
      <circle cx="50" cy="38" r="14" fill="#c68642" />
      {/* Sharp features */}
      <ellipse cx="44" cy="36" rx="3" ry="2" fill={accent} />
      <ellipse cx="56" cy="36" rx="3" ry="2" fill={accent} />
      <circle cx="44" cy="36" r="1.2" fill="#1a1a1a" />
      <circle cx="56" cy="36" r="1.2" fill="#1a1a1a" />
      {/* Strong jaw / determined mouth */}
      <line x1="46" y1="44" x2="54" y2="44" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      {/* Hair (windswept, short) */}
      <path d="M34 34 Q36 18 50 16 Q64 18 66 34" fill={accent} opacity="0.6" />
      <path d="M30 36 Q32 28 36 26" stroke={color} strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M70 36 Q68 28 64 26" stroke={color} strokeWidth="2" fill="none" opacity="0.5" />
      {/* Gold streaks in hair */}
      <path d="M42 20 L46 28" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <path d="M54 19 L56 26" stroke={color} strokeWidth="1.5" opacity="0.4" />
      {/* Armor/torso */}
      <path d="M38 50 L34 78 L66 78 L62 50" fill={accent} opacity="0.4" />
      {/* Belt */}
      <rect x="36" y="62" width="28" height="3" rx="1.5" fill={accent} opacity="0.6" />
      {/* Eagle legs */}
      <line x1="40" y1="78" x2="38" y2="94" stroke={color} strokeWidth="3" opacity="0.6" />
      <line x1="60" y1="78" x2="62" y2="94" stroke={color} strokeWidth="3" opacity="0.6" />
      {/* Talons */}
      <path d="M34 94 L38 94 L42 94" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <path d="M58 94 L62 94 L66 94" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      {/* Tail feathers */}
      <path d="M50 78 L44 90 L50 88 L56 90 Z" fill={color} opacity="0.5" />
    </svg>
  ),
  selene: (color, accent, size) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill={accent} fillOpacity="0.15" stroke={color} strokeWidth="2" />
      {/* Cozy blanket/wings */}
      <path d="M20 50 Q15 70 25 85 L75 85 Q85 70 80 50" fill={color} opacity="0.15" rx="10" />
      {/* Hair */}
      <path d="M30 38 Q32 22 50 20 Q68 22 70 38 L68 52 Q60 48 50 50 Q40 48 32 52 Z" fill={color} />
      {/* Face */}
      <circle cx="50" cy="40" r="14" fill={color} opacity="0.9" />
      {/* Sleepy eyes (heterochromia) */}
      <ellipse cx="44" cy="39" rx="3" ry="2.5" fill="#d4af37" />
      <circle cx="44" cy="39" r="1.5" fill="#1a1a2e" />
      <ellipse cx="56" cy="39" rx="3" ry="2.5" fill="#6ea8d4" />
      <circle cx="56" cy="39" r="1.5" fill="#1a1a2e" />
      {/* Sleepy content expression */}
      <path d="M46 46 Q50 48 54 46" stroke={accent} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Cat ears */}
      <path d="M34 28 L26 10 L40 24" fill={color} />
      <path d="M34 28 L28 14 L38 24" fill={accent} opacity="0.3" />
      <path d="M66 28 L74 10 L60 24" fill={color} />
      <path d="M66 28 L72 14 L62 24" fill={accent} opacity="0.3" />
      {/* Oversized sweater */}
      <path d="M34 52 Q30 56 28 70 L28 82 L72 82 L72 70 Q70 56 66 52" fill={color} opacity="0.5" />
      <line x1="50" y1="52" x2="50" y2="82" stroke={accent} strokeWidth="0.5" opacity="0.2" />
      {/* Sleeve falling off shoulder */}
      <path d="M34 52 Q28 54 24 62" stroke={color} strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
      {/* Tail (curling around) */}
      <path d="M66 72 Q76 70 80 65 Q84 60 82 55 Q80 52 76 54" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Mr Bubbles (plush fish) */}
      <ellipse cx="78" cy="68" rx="6" ry="4" fill={accent} opacity="0.4" />
      <circle cx="81" cy="67" r="1" fill={accent} opacity="0.6" />
      <path d="M74 65 L70 62" stroke={accent} strokeWidth="1" opacity="0.3" />
      {/* Zzz */}
      <text x="72" y="28" fontSize="8" fill={color} opacity="0.4" fontFamily="serif">z</text>
      <text x="78" y="22" fontSize="6" fill={color} opacity="0.3" fontFamily="serif">z</text>
      <text x="82" y="17" fontSize="5" fill={color} opacity="0.2" fontFamily="serif">z</text>
      {/* Paw print socks */}
      <circle cx="40" cy="90" r="2" fill={accent} opacity="0.3" />
      <circle cx="60" cy="90" r="2" fill={accent} opacity="0.3" />
    </svg>
  ),
};

export function CharacterAvatar({ character, size = 80, className = "" }: CharacterAvatarProps) {
  const designFn = avatarDesigns[character.id];

  if (!designFn) {
    return (
      <div
        className={`rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size, background: character.avatarColor }}
      >
        <span style={{ fontSize: size * 0.4, color: character.avatarAccent }}>
          {character.name[0]}
        </span>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      {designFn(character.avatarColor, character.avatarAccent, size)}
    </div>
  );
}
