import { NextResponse } from 'next/server';
import { getBridgeStatus } from '@/lib/discord-bridge';

export async function GET() {
  try {
    const status = getBridgeStatus();

    return NextResponse.json({
      messages: [],
      bridge: status,
    });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}
