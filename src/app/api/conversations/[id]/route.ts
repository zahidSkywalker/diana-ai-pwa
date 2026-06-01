import { NextRequest, NextResponse } from 'next/server';
import { updateConversationTitle } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title } = await request.json();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    await updateConversationTitle(id, title);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Conversation PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}
