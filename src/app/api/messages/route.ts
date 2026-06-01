import { NextResponse } from 'next/server';
import { fetchDiscordMessages, getDiscordStatus } from '@/lib/discord';

export async function GET() {
  try {
    const status = getDiscordStatus();

    if (!status.configured) {
      return NextResponse.json({
        messages: [],
        discord: status,
        note: 'Discord is not configured. Set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID env vars to enable.',
      });
    }

    const messages = await fetchDiscordMessages(50);

    return NextResponse.json({
      messages,
      discord: status,
    });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}
