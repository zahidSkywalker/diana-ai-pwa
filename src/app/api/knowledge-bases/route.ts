import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json([]);
  } catch (error) {
    console.error('GET knowledge bases error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action === 'create') {
      const { title, description } = await req.json();
      const kbId = crypto.randomUUID ? crypto.randomUUID() : `kb_${Date.now()}`;
      return NextResponse.json({
        id: kbId,
        title: title || 'Untitled Knowledge Base',
        description: description || '',
        createdAt: new Date().toISOString(),
        entries: [],
      });
    }

    if (action === 'addEntry') {
      const { id, entryTitle, entryContent } = await req.json();
      const entryId = crypto.randomUUID ? crypto.randomUUID() : `entry_${Date.now()}`;
      return NextResponse.json({
        id: entryId,
        knowledgeBaseId: id,
        title: entryTitle || 'Untitled Entry',
        content: entryContent || '',
        createdAt: new Date().toISOString(),
      });
    }

    if (action === 'deleteEntry') {
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE knowledge base error:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge base' }, { status: 500 });
  }
}
