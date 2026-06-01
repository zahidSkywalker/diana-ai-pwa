import { NextRequest, NextResponse } from 'next/server';
import { aiChat, getEngineStatus } from '@/lib/ai-engine';

const CLI_TOKEN = process.env.ZENITH_TOKEN || 'zenith-cli-2026';

const SYSTEM_PROMPT = `You are Echo AI, a versatile assistant handling requests from the Zenith CLI client. Help with any task. Be concise and direct.`;

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${CLI_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const aiMessages = messages
      .filter((m: { role: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await aiChat(aiMessages, SYSTEM_PROMPT);

    return NextResponse.json({
      id: response ? `zenith_${Date.now()}` : undefined,
      content: response || null,
      tool_calls: null,
      finish_reason: response ? 'stop' : 'error',
      usage: null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Zenith API error:', msg);
    return NextResponse.json({ error: 'Request failed', details: msg }, { status: 500 });
  }
}

export async function GET() {
  const status = getEngineStatus();
  return NextResponse.json({
    status: status.configured ? 'online' : 'offline',
    service: 'Zenith Relay',
    version: '3.0.0',
    creator: 'Zahidul Islam',
    engine: status,
    timestamp: new Date().toISOString(),
  });
}
