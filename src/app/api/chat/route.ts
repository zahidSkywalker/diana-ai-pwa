import { NextRequest, NextResponse } from 'next/server';
import { aiChat, getEngineStatus } from '@/lib/ai-engine';

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

const SYSTEM_PROMPT = `You are Echo AI, an advanced AI assistant created by Zahidul Islam. You are intelligent, creative, and versatile — skilled at coding, research, writing, analysis, math, and much more. Be helpful, concise, and accurate. Format responses in markdown when appropriate.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastUserMsg = messages
      .filter((m: ChatMessage) => m.role === 'user')
      .pop();

    if (!lastUserMsg) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    // Build conversation for AI — include history for context
    const aiMessages = messages
      .filter((m: ChatMessage) => m.role !== 'system')
      .map((m: ChatMessage) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Direct AI call — no Discord, no bridge
    const response = await aiChat(aiMessages, SYSTEM_PROMPT);

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

// Status endpoint
export async function GET() {
  const status = getEngineStatus();
  return NextResponse.json({
    status: status.configured ? 'online' : 'offline',
    service: 'Echo AI Chat',
    version: '3.0.0',
    engine: status,
    timestamp: new Date().toISOString(),
  });
}
