import { NextRequest, NextResponse } from 'next/server';
import { mistralChat, createSSEStream } from '@/lib/mistral';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const systemPrompt = `You are JARVIS Co-Writer, an AI writing assistant embedded in a document editor. You address the user as "Sir". You help with:
1. Writing, editing, and improving documents
2. Generating content based on instructions
3. Improving grammar, style, and clarity
4. Summarizing or expanding text
5. Providing writing suggestions
Be concise and directly useful. Format responses in markdown when appropriate.`;

    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await mistralChat(allMessages, true);
    const stream = createSSEStream(response as Response);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Co-Writer API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
