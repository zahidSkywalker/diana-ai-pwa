import { ChatMessage, ChatHistory } from "./types";

const STORAGE_PREFIX = "mythicmuse-chat-";

export function saveChatHistory(characterId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const history: ChatHistory = {
      characterId,
      messages,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${characterId}`, JSON.stringify(history));
  } catch (e) {
    console.warn("Failed to save chat history:", e);
  }
}

export function loadChatHistory(characterId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${characterId}`);
    if (!raw) return [];
    const history: ChatHistory = JSON.parse(raw);
    return history.messages || [];
  } catch (e) {
    console.warn("Failed to load chat history:", e);
    return [];
  }
}

export function clearChatHistory(characterId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${characterId}`);
}

export function getAllChatHistories(): Record<string, ChatMessage[]> {
  if (typeof window === "undefined") return {};
  try {
    const result: Record<string, ChatMessage[]> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const characterId = key.slice(STORAGE_PREFIX.length);
        result[characterId] = loadChatHistory(characterId);
      }
    }
    return result;
  } catch (e) {
    console.warn("Failed to load chat histories:", e);
    return {};
  }
}
