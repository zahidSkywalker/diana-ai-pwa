// MongoDB Memory Store — stores Diana's long-term memory via Mongoose
// Falls back to in-memory if MONGODB_URI is not set

import mongoose, { Schema, Document, Model } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// ─── Schemas ────────────────────────────────────────────────────

interface IMemory extends Document {
  key: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IConversation extends Document {
  externalId: string;      // matches Prisma conversation ID
  title: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserProfile extends Document {
  userId: string;
  name: string;
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>({
  key: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  category: { type: String, default: 'general' },
}, { timestamps: true });

const ConversationSchema = new Schema<IConversation>({
  externalId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  summary: { type: String },
}, { timestamps: true });

const UserProfileSchema = new Schema<IUserProfile>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, default: 'User' },
  preferences: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// ─── Models ─────────────────────────────────────────────────────

let Memory: Model<IMemory>;
let Conversation: Model<IConversation>;
let UserProfile: Model<IUserProfile>;
let isConnected = false;

// In-memory fallback
const memoryStore = new Map<string, { content: string; category: string }>();

export async function connectMongoDB(): Promise<boolean> {
  if (!MONGODB_URI) {
    console.log('[MongoDB] No MONGODB_URI set — using in-memory fallback');
    return false;
  }

  if (isConnected) return true;

  try {
    await mongoose.connect(MONGODB_URI);
    Memory = mongoose.model<IMemory>('Memory', MemorySchema);
    Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
    UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
    isConnected = true;
    console.log('[MongoDB] Connected successfully');
    return true;
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    return false;
  }
}

export function isConnectedToMongo(): boolean {
  return isConnected;
}

// ─── Memory Operations ──────────────────────────────────────────

export async function saveMemory(key: string, content: string, category = 'general'): Promise<void> {
  if (isConnected && Memory) {
    await Memory.findOneAndUpdate(
      { key },
      { content, category },
      { upsert: true, new: true }
    );
  } else {
    memoryStore.set(key, { content, category });
  }
}

export async function getMemory(key: string): Promise<string | null> {
  if (isConnected && Memory) {
    const doc = await Memory.findOne({ key });
    return doc?.content || null;
  } else {
    return memoryStore.get(key)?.content || null;
  }
}

export async function getAllMemories(category?: string): Promise<Array<{ key: string; content: string; category: string }>> {
  if (isConnected && Memory) {
    const query = category ? { category } : {};
    const docs = await Memory.find(query);
    return docs.map(d => ({ key: d.key, content: d.content, category: d.category }));
  } else {
    const all = Array.from(memoryStore.entries()).map(([key, val]) => ({
      key,
      content: val.content,
      category: val.category,
    }));
    if (category) return all.filter(m => m.category === category);
    return all;
  }
}

export async function deleteMemory(key: string): Promise<void> {
  if (isConnected && Memory) {
    await Memory.deleteOne({ key });
  } else {
    memoryStore.delete(key);
  }
}

// ─── Conversation Summary (MongoDB mirror) ─────────────────────

export async function syncConversation(externalId: string, title: string, summary?: string): Promise<void> {
  if (isConnected && Conversation) {
    await Conversation.findOneAndUpdate(
      { externalId },
      { title, summary },
      { upsert: true, new: true }
    );
  }
}

export async function getConversationSummary(externalId: string): Promise<string | null> {
  if (isConnected && Conversation) {
    const doc = await Conversation.findOne({ externalId });
    return doc?.summary || null;
  }
  return null;
}

// ─── User Profile ──────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<Record<string, unknown> | null> {
  if (isConnected && UserProfile) {
    const doc = await UserProfile.findOne({ userId });
    return doc?.preferences || null;
  }
  return null;
}

export async function updateUserProfile(userId: string, prefs: Record<string, unknown>): Promise<void> {
  if (isConnected && UserProfile) {
    await UserProfile.findOneAndUpdate(
      { userId },
      { preferences: prefs },
      { upsert: true, new: true }
    );
  }
}
