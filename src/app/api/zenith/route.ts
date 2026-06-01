import { NextRequest, NextResponse } from 'next/server';
import { bridgeChat, getBridgeStatus } from '@/lib/discord-bridge';

const CLI_TOKEN = process.env.ZENITH_TOKEN || 'zenith-cli-2026';

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

    const status = getBridgeStatus();
    if (!status.configured) {
      return NextResponse.json({
        content: "Zenith's Discord bridge is being configured. Please try again shortly.",
        tool_calls: null,
        finish_reason: 'stop',
        usage: null,
        timestamp: new Date().toISOString(),
      });
    }

    // Build prompt from messages for Echo
    const history = messages
      .filter((m: { role: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => `${m.role === 'assistant' ? 'Echo' : 'User'}: ${m.content}`)
      .join('\n');

    const response = await bridgeChat(history);

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
  const status = getBridgeStatus();
  return NextResponse.json({
    status: status.configured ? 'online' : 'configuring',
    service: 'Zenith Relay',
    version: '2.0.0',
    creator: 'Zahidul Islam',
    bridge: status,
    timestamp: new Date().toISOString(),
  });
}
