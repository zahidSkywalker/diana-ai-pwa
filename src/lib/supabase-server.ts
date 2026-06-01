/**
 * Supabase server-side helpers for Vercel deployment
 * Uses REST API via fetch — no heavy ORM, works in serverless
 * 
 * Uses the existing diana_memory table with category prefixes:
 * - jarvis_conversation:{id} → conversation metadata (JSON: {id, title, created_at, updated_at})
 * - jarvis_messages:{conversation_id}:{message_index} → messages (JSON: {role, content, created_at})
 * - jarvis_memory:{key} → persistent memory
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iprzxslxipmkivhxupce.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwcnp4c2x4aXBta2l2aHh1cGNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1NDY3MywiZXhwIjoyMDk1MDMwNjczfQ.uQ43loTJ1oQhKqty735v-v0HehGehc0_CoMHxTcozHg'

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
}

function sbFetch(path: string, options: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...HEADERS, ...(options.headers as Record<string, string>) },
  })
}

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  role: string
  content: string
  conversationId: string
  createdAt: string
}

interface Memory {
  id: string
  key: string
  value: string
  category: string
  createdAt: string
  updatedAt: string
}

// ─── Helper: generate unique IDs ──────────────────────
function genId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
}

// ─── Conversations ────────────────────────────────────

export async function getConversations(limit = 50): Promise<Conversation[]> {
  const res = await sbFetch(
    `diana_memory?category=eq.jarvis_conversation&order=metadata->>created_at.desc&limit=${limit}`,
    { headers: { ...HEADERS, Prefer: 'count=exact' } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data
    .map((row: any) => {
      try {
        const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {})
        return {
          id: meta.id || row.id,
          title: meta.title || 'Untitled',
          createdAt: meta.created_at || row.timestamp || '',
          updatedAt: meta.updated_at || row.timestamp || '',
        }
      } catch { return null }
    })
    .filter(Boolean) as Conversation[]
}

export async function createConversation(title: string): Promise<Conversation> {
  const id = genId()
  const now = new Date().toISOString()
  const res = await sbFetch('diana_memory', {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify({
      content: `Conversation: ${title || 'New Conversation'}`,
      category: 'jarvis_conversation',
      metadata: { id, title: title || 'New Conversation', created_at: now, updated_at: now },
    }),
  })
  if (!res.ok) throw new Error('Failed to create conversation')
  return { id, title: title || 'New Conversation', createdAt: now, updatedAt: now }
}

export async function deleteConversation(id: string): Promise<void> {
  // Delete all messages for this conversation
  await sbFetch('diana_memory?category=eq.jarvis_message&metadata->>conversation_id=eq.' + id, {
    method: 'DELETE',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
  })
  // Delete the conversation entry
  await sbFetch(`diana_memory?category=eq.jarvis_conversation&metadata->>id=eq.${id}`, {
    method: 'DELETE',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
  })
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await sbFetch(
    `diana_memory?category=eq.jarvis_message&metadata->>conversation_id=eq.${conversationId}&order=metadata->>created_at.asc&limit=100`
  )
  if (!res.ok) return []
  const data = await res.json()
  return data
    .map((row: any) => {
      try {
        const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {})
        return {
          id: meta.id || row.id,
          role: meta.role || 'user',
          content: row.content || '',
          conversationId: meta.conversation_id || conversationId,
          createdAt: meta.created_at || row.timestamp || '',
        }
      } catch { return null }
    })
    .filter(Boolean) as Message[]
}

export async function saveMessage(conversationId: string, role: string, content: string): Promise<void> {
  const id = genId()
  const now = new Date().toISOString()
  
  await sbFetch('diana_memory', {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({
      content,
      category: 'jarvis_message',
      metadata: {
        id,
        conversation_id: conversationId,
        role,
        created_at: now,
      },
    }),
  })

  // Update conversation's updated_at
  // Use PATCH on the conversation entry
  await sbFetch(`diana_memory?category=eq.jarvis_conversation&metadata->>id=eq.${conversationId}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({
      metadata: { updated_at: now },
    }),
  })
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await sbFetch(`diana_memory?category=eq.jarvis_conversation&metadata->>id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({
      metadata: { title },
    }),
  })
}

// ─── Memories ─────────────────────────────────────────

export async function getMemories(limit = 50): Promise<Memory[]> {
  const res = await sbFetch(`diana_memory?category=eq.jarvis_memory&order=timestamp.desc&limit=${limit}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.map((row: any) => ({
    id: row.id,
    key: typeof row.metadata === 'string' ? JSON.parse(row.metadata).key : (row.metadata?.key || ''),
    value: row.content || '',
    category: typeof row.metadata === 'string' ? JSON.parse(row.metadata).cat : (row.metadata?.cat || 'general'),
    createdAt: row.timestamp || '',
    updatedAt: row.timestamp || '',
  }))
}

export async function saveMemory(key: string, value: string, category = 'general'): Promise<Memory> {
  // Upsert: delete existing, then insert
  await sbFetch(`diana_memory?category=eq.jarvis_memory&metadata->>key=eq.${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
  })
  
  const res = await sbFetch('diana_memory', {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify({
      content: value,
      category: 'jarvis_memory',
      metadata: { key, cat: category },
    }),
  })
  if (!res.ok) throw new Error('Failed to save memory')
  const data = await res.json()
  return { id: data[0].id, key, value, category, createdAt: data[0].timestamp, updatedAt: data[0].timestamp }
}

export async function deleteMemory(key: string): Promise<void> {
  await sbFetch(`diana_memory?category=eq.jarvis_memory&metadata->>key=eq.${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
  })
}
