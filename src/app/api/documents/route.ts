import { NextRequest, NextResponse } from 'next/server';
import { sbFetch } from '@/lib/supabase-server';

// Documents — stored in Supabase diana_memory table

export async function GET() {
  try {
    const res = await sbFetch(
      `diana_memory?category=eq.diana_document&order=timestamp.desc&limit=50`,
      { headers: { Prefer: 'count=exact' } }
    );
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(
      data.map((row: any) => {
        try {
          const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {});
          return { id: meta.id || row.id, title: meta.title || 'Untitled', content: row.content || '', updatedAt: row.timestamp || '' };
        } catch { return null; }
      }).filter(Boolean)
    );
  } catch (error) {
    console.error('GET documents error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, title, content } = await req.json();
    const docId = id || (crypto.randomUUID ? crypto.randomUUID() : `doc_${Date.now()}`);
    const now = new Date().toISOString();

    await sbFetch('diana_memory', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        content: content || '',
        category: 'diana_document',
        metadata: { id: docId, title: title || 'Untitled Document', updated_at: now },
      }),
    });

    return NextResponse.json({
      id: docId,
      title: title || 'Untitled Document',
      content: content || '',
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('POST document error:', error);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    await sbFetch(`diana_memory?category=eq.diana_document&metadata->>id=eq.${id}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
