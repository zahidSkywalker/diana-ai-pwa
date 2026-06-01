import { NextRequest, NextResponse } from 'next/server';
import { aiChat, getEngineStatus } from '@/lib/ai-engine';

const CLI_TOKEN = process.env.ECHO_CLI_TOKEN || 'echo-cli-2026-auth';

const SYSTEM_PROMPT = `You are Echo AI, a versatile assistant. Help with any task the user requests. Be concise and direct.`;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CLI_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const aiMessages = messages
      .filter((m: { role: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await aiChat(aiMessages, SYSTEM_PROMPT);

    return NextResponse.json({
      content: response || 'No response generated.',
      sessionId: sessionId || null,
      timestamp: new Date().toISOString(),
      model: 'echo-direct',
      usage: null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Echo CLI API error:', msg);
    return NextResponse.json(
      { error: 'Failed to process request', details: msg },
      { status: 500 }
    );
  }
}

export async function GET() {
  const status = getEngineStatus();
  return NextResponse.json({
    status: status.configured ? 'online' : 'offline',
    service: 'Echo CLI Relay',
    version: '3.0.0',
    engine: status,
    timestamp: new Date().toISOString(),
  });
}
