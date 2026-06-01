import { NextRequest, NextResponse } from 'next/server'
import { getMemories, saveMemory, deleteMemory } from '@/lib/supabase-server'

// GET memories
export async function GET() {
  try {
    const memories = await getMemories()
    return NextResponse.json(memories)
  } catch (error) {
    console.error('Memory GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 })
  }
}

// POST - save or update a memory
export async function POST(request: NextRequest) {
  try {
    const { key, value, category } = await request.json()
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }
    const memory = await saveMemory(key, value, category || 'general')
    return NextResponse.json(memory)
  } catch (error) {
    console.error('Memory POST error:', error)
    return NextResponse.json({ error: 'Failed to save memory' }, { status: 500 })
  }
}

// DELETE a memory
export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json()
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }
    await deleteMemory(key)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Memory DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 })
  }
}
