import { NextRequest, NextResponse } from 'next/server';
import { bridgeChat, getBridgeStatus } from '@/lib/discord-bridge';

const CLI_TOKEN = process.env.DIANA_CLI_TOKEN || 'diana-cli-2026-auth';

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

    const status = getBridgeStatus();
    if (!status.configured) {
      return NextResponse.json({
        content: "Diana's Discord bridge is being configured. Please try again shortly.",
        sessionId: sessionId || null,
        timestamp: new Date().toISOString(),
        model: 'diana-discord',
        usage: null,
      });
    }

    // Build prompt from messages
    const history = messages
      .filter((m: { role: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => `${m.role === 'assistant' ? 'Diana' : 'User'}: ${m.content}`)
      .join('\n');

    const response = await bridgeChat(history);
    const messageContent = response || 'No response generated.';

    return NextResponse.json({
      content: messageContent,
      sessionId: sessionId || null,
      timestamp: new Date().toISOString(),
      model: 'diana-discord',
      usage: null,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Diana CLI API error:', msg);
    return NextResponse.json(
      { error: 'Failed to process request', details: msg },
      { status: 500 }
    );
  }
}

export async function GET() {
  const status = getBridgeStatus();
  return NextResponse.json({
    status: status.configured ? 'online' : 'configuring',
    service: 'Diana CLI Relay',
    version: '2.0.0',
    bridge: status,
    timestamp: new Date().toISOString(),
  });
}
