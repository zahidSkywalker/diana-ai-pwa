import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role, content, attachments } = await request.json();
    if (!role || !content) {
      return NextResponse.json({ error: 'Role and content are required' }, { status: 400 });
    }
    const message = await db.message.create({
      data: {
        conversationId: id,
        role,
        content,
        attachments: attachments ? JSON.stringify(attachments) : '[]',
      },
    });
    return NextResponse.json(message);
  } catch (error) {
    console.error('Message POST error:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
