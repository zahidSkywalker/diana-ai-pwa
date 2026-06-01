// HexaGon AI — Type definitions

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  icon?: string;
  tier: 'free' | 'paid';
}

export interface ChatRequest {
  messages: { role: string; content: string }[];
  model: string;
  stream?: boolean;
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    bot: boolean;
  };
  timestamp: string;
  channel_id: string;
}

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'echo-discord',
    name: 'Echo AI',
    description: 'Echo responds through Discord bridge',
    provider: 'discord',
    tier: 'free',
  },
];

export const DEFAULT_MODEL = 'echo-discord';

export const SYSTEM_PROMPT = `You are HexaGon AI, a versatile and intelligent AI assistant created to help users with a wide range of tasks. You can assist with:

- **Coding** — Write, debug, and explain code in any language
- **Research** — Provide comprehensive analysis and summaries
- **Writing** — Draft, edit, and improve written content
- **Analysis** — Break down complex problems and data
- **General Questions** — Answer questions on any topic

Be concise but thorough. Use markdown formatting when helpful for readability (headers, lists, code blocks, tables). When writing code, always specify the language. Be friendly, professional, and direct.`;

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function createNewSession(model: string): ChatSession {
  return {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    model,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
