import { NextRequest, NextResponse } from 'next/server';
import { bridgeChat } from '@/lib/discord-bridge';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const chatHistory = messages
      .map((m: { role: string; content: string }) => `${m.role === 'assistant' ? 'Echo' : 'User'}: ${m.content}`)
      .join('\n');

    const prompt = `[You are JARVIS Co-Writer]: Help with writing, editing, and improving documents. Be concise and useful. Format in markdown.\n\n${chatHistory}`;

    const response = await bridgeChat(prompt);

    const text = response || 'I could not process your request.';
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        let i = 0;
        const interval = setInterval(() => {
          if (i < text.length) {
            const chunk = text.slice(i, Math.min(i + 3, text.length));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            i += 3;
          } else {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            clearInterval(interval);
          }
        }, 15);
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (error) {
    console.error('Co-Writer API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
