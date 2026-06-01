import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    const knowledgeBases = await db.knowledgeBase.findMany({
      orderBy: { createdAt: 'desc' },
      include: { entries: { orderBy: { createdAt: 'desc' } } },
    });
    return NextResponse.json(knowledgeBases);
  } catch (error) {
    console.error('GET knowledge bases error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, title, description, action, entryTitle, entryContent } = await req.json();

    if (action === 'create') {
      try {
        const { db } = await import('@/lib/db');
        const kb = await db.knowledgeBase.create({
          data: {
            title: title || 'Untitled Knowledge Base',
            description: description || '',
          },
          include: { entries: true },
        });
        return NextResponse.json(kb);
      } catch {
        const kbId = crypto.randomUUID ? crypto.randomUUID() : `kb_${Date.now()}`;
        return NextResponse.json({
          id: kbId,
          title: title || 'Untitled Knowledge Base',
          description: description || '',
          createdAt: new Date().toISOString(),
          entries: [],
        });
      }
    }

    if (action === 'addEntry' && id) {
      try {
        const { db } = await import('@/lib/db');
        const kb = await db.kBEntry.create({
          data: {
            knowledgeBaseId: id,
            title: entryTitle || 'Untitled Entry',
            content: entryContent || '',
          },
        });
        return NextResponse.json(kb);
      } catch {
        const entryId = crypto.randomUUID ? crypto.randomUUID() : `entry_${Date.now()}`;
        return NextResponse.json({
          id: entryId,
          knowledgeBaseId: id,
          title: entryTitle || 'Untitled Entry',
          content: entryContent || '',
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (action === 'deleteEntry') {
      try {
        const { db } = await import('@/lib/db');
        await db.kBEntry.delete({ where: { id: entryTitle } });
      } catch {}
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST knowledge base error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Knowledge base ID required' }, { status: 400 });
    try {
      const { db } = await import('@/lib/db');
      await db.knowledgeBase.delete({ where: { id } });
    } catch {}
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE knowledge base error:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge base' }, { status: 500 });
  }
}
