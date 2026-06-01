import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('GET conversations error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, mode, message, attachments } = await req.json();

    const conversation = await db.conversation.create({
      data: {
        title: title || 'New Conversation',
        mode: mode || 'chat',
        messages: message ? {
          create: {
            role: 'user',
            content: message,
            attachments: attachments ? JSON.stringify(attachments) : '[]',
          },
        } : undefined,
      },
      include: { messages: true },
    });
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('POST conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }
    await db.message.deleteMany({ where: { conversationId: id } });
    await db.conversation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE conversation error:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
