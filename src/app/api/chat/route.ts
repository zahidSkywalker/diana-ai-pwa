import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const SYSTEM_PROMPT = `You are Diana AI, an advanced AI assistant created by Zahidul Islam. You are intelligent, creative, and versatile. You can help with coding, research, writing, analysis, math, and much more. You speak in a friendly but professional tone. You use markdown formatting for clarity. You NEVER address the user as 'Sir'.`;

function createSSEStreamFromAsyncIterable(stream: AsyncIterable<any>) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        const errorMsg = 'I apologize for the interruption. Please try again.';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content: errorMsg })}\n\n`)
        );
        controller.close();
      }
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const allMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const zai = await ZAI.create();
    const stream = await zai.chat.completions.create({
      messages: allMessages,
      stream: true,
    });

    const sseStream = createSSEStreamFromAsyncIterable(stream);

    return new Response(sseStream, {
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
