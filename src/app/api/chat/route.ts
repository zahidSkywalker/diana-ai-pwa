import { NextRequest, NextResponse } from 'next/server';
import { bridgeChat, getBridgeStatus } from '@/lib/discord-bridge';

interface ChatMessage {
  role: string;
  content: string;
}

// ─── Stream text as SSE with typing effect ────────────
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

// ─── Stream Echo's Discord bridge response as SSE ──────
function createBridgeSSEStream(text: string) {
  return createTextSSEStream(text);
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const status = getBridgeStatus();
    if (!status.configured) {
      const msg = "My Discord bridge is being set up. I'll be ready shortly — check back soon!";
      return new Response(createTextSSEStream(msg), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Build user message from conversation history
    const lastUserMsg = messages
      .filter((m: ChatMessage) => m.role === 'user')
      .pop();

    if (!lastUserMsg) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    // Build context from conversation history (exclude last user message)
    const history = messages
      .filter((m: ChatMessage) => m.role !== 'system' && m !== lastUserMsg)
      .map((m: ChatMessage) => `${m.role === 'assistant' ? 'Echo' : 'User'}: ${m.content}`)
      .join('\n');

    const fullMessage = history
      ? `[Conversation context]:\n${history}\n\n[Current message]: ${lastUserMsg.content}`
      : lastUserMsg.content;

    // Send through Discord bridge — Echo's AI brain
    const response = await bridgeChat(fullMessage);

    if (!response) {
      const errMsg = "I couldn't reach my brain right now. Please try again in a moment.";
      return new Response(createTextSSEStream(errMsg), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return new Response(createBridgeSSEStream(response), {
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

// Status endpoint
export async function GET() {
  const status = getBridgeStatus();
  return NextResponse.json({
    status: status.configured ? 'online' : 'configuring',
    service: 'Echo AI Chat',
    version: '2.0.0',
    bridge: status,
    timestamp: new Date().toISOString(),
  });
}
