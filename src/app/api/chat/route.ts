import { NextRequest, NextResponse } from 'next/server';

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

// Streaming text response as SSE fallback
function createTextSSEStream(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      // Stream character by character for a typing effect
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

    const allMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Try z-ai-web-dev-sdk first
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
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
    } catch (sdkError) {
      console.error('z-ai-web-dev-sdk unavailable, using fallback:', sdkError);

      // Fallback: try Mistral API if key available
      const mistralKey = process.env.MISTRAL_API_KEY;
      if (mistralKey) {
        try {
          const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${mistralKey}`,
            },
            body: JSON.stringify({
              model: 'mistral-small-latest',
              messages: allMessages,
              stream: true,
              max_tokens: 2048,
            }),
          });

          if (response.ok && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            const sseStream = new ReadableStream({
              async start(controller) {
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const text = decoder.decode(value, { stream: true });
                    const lines = text.split('\n');
                    for (const line of lines) {
                      if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;
                        try {
                          const parsed = JSON.parse(data);
                          const content = parsed.choices?.[0]?.delta?.content || '';
                          if (content) {
                            controller.enqueue(
                              new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                            );
                          }
                        } catch { /* skip */ }
                      }
                    }
                  }
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  controller.close();
                } catch (err) {
                  controller.close();
                }
              },
            });

            return new Response(sseStream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
              },
            });
          }
        } catch (mistralError) {
          console.error('Mistral API failed:', mistralError);
        }
      }

      // Final fallback: static response
      const fallbackResponse = "Hello! I'm Diana AI, currently running in a limited mode. My full AI capabilities are being set up. Please try again in a moment!";
      return new Response(createTextSSEStream(fallbackResponse), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
