import { NextRequest, NextResponse } from 'next/server';
import { bridgeChat, getBridgeStatus } from '@/lib/discord-bridge';

interface ChatMessage {
  role: string;
  content: string;
}

function createTextSSEStream(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          const chunk = text.slice(i, Math.min(i + 3, text.length));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
          i += 3;
        } else {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          clearInterval(interval);
        }
      }, 20);
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const status = getBridgeStatus();
    if (!status.configured) {
      const msg = "I'm getting set up. I'll be ready shortly — check back soon!";
      return new Response(createTextSSEStream(msg), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const lastUserMsg = messages
      .filter((m: ChatMessage) => m.role === 'user')
      .pop();

    if (!lastUserMsg) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    // Build context from conversation history
    const history = messages
      .filter((m: ChatMessage) => m.role !== 'system' && m !== lastUserMsg)
      .map((m: ChatMessage) => `${m.role === 'assistant' ? 'Echo' : 'User'}: ${m.content}`)
      .join('\n');

    const fullMessage = history
      ? `[Conversation context]:\n${history}\n\n[Current message]: ${lastUserMsg.content}`
      : lastUserMsg.content;

    const response = await bridgeChat(fullMessage);

    if (!response) {
      const errMsg = "I couldn't process that right now. Please try again in a moment.";
      return new Response(createTextSSEStream(errMsg), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return new Response(createTextSSEStream(response), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const status = getBridgeStatus();
  return NextResponse.json({
    status: status.configured ? 'online' : 'configuring',
    service: 'Echo AI Chat',
    version: '3.0.0',
    bridge: status,
    timestamp: new Date().toISOString(),
  });
}
