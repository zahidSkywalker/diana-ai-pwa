export interface Character {
  id: string;
  name: string;
  species: string;
  description: string;
  shortDescription: string;
  systemPrompt: string;
  avatarColor: string;
  avatarAccent: string;
  greeting: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  image?: string;
  timestamp: number;
}

export interface ChatHistory {
  characterId: string;
  messages: ChatMessage[];
  lastUpdated: number;
}
