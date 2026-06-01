import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    const documents = await db.document.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('GET documents error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, title, content } = await req.json();

    try {
      const { db } = await import('@/lib/db');

      if (id) {
        const document = await db.document.update({
          where: { id },
          data: { title, content },
        });
        return NextResponse.json(document);
      }

      const document = await db.document.create({
        data: { title: title || 'Untitled Document', content: content || '' },
      });
      return NextResponse.json(document);
    } catch {
      // Fallback for serverless
      const docId = id || (crypto.randomUUID ? crypto.randomUUID() : `doc_${Date.now()}`);
      return NextResponse.json({
        id: docId,
        title: title || 'Untitled Document',
        content: content || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
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

    try {
      const { db } = await import('@/lib/db');
      await db.document.delete({ where: { id } });
    } catch {}
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
