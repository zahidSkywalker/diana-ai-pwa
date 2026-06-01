import { NextResponse } from 'next/server';
import { getEngineStatus } from '@/lib/ai-engine';

// Messages endpoint — returns engine status (no more Discord dependency)
export async function GET() {
  try {
    const status = getEngineStatus();

    return NextResponse.json({
      messages: [],
      engine: status,
    });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}
