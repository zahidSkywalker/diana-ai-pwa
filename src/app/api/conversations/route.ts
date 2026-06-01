import { NextRequest, NextResponse } from 'next/server';
import {
  getConversations as sbGetConversations,
  createConversation as sbCreateConversation,
  deleteConversation as sbDeleteConversation,
} from '@/lib/supabase-server';

export async function GET() {
  try {
    const conversations = await sbGetConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('GET conversations error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, message, attachments } = await req.json();
    const conversation = await sbCreateConversation(title || 'New Conversation');

    // If first message provided, save it
    if (message) {
      const { saveMessage } = await import('@/lib/supabase-server');
      await saveMessage(
        conversation.id,
        'user',
        message,
      );
    }

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      mode: 'chat',
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: [],
    });
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
    await sbDeleteConversation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE conversation error:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
