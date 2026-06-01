// HexaGon AI — Discord REST API helpers

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || process.env.DISCORD_CHANNEL || '1498728892150714509';

interface DiscordAPIError {
  message: string;
  code: number;
}

interface DiscordAPIMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    bot: boolean;
  };
  timestamp: string;
  channel_id: string;
}

function isDiscordConfigured(): boolean {
  return !!(DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID);
}

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'HexaGonAI/1.0',
  };
}

export async function fetchDiscordMessages(limit: number = 50): Promise<DiscordAPIMessage[]> {
  if (!isDiscordConfigured()) {
    console.log('Discord not configured — skipping message fetch');
    return [];
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages?limit=${limit}`,
      { headers: getHeaders() },
    );

    if (!response.ok) {
      const error: DiscordAPIError = await response.json().catch(() => ({ message: 'Unknown error', code: 0 }));
      console.error('Discord fetch error:', error.message);
      return [];
    }

    const messages: DiscordAPIMessage[] = await response.json();
    return messages.reverse(); // Oldest first
  } catch (error) {
    console.error('Discord API fetch failed:', error);
    return [];
  }
}

export async function sendDiscordMessage(content: string): Promise<boolean> {
  if (!isDiscordConfigured()) {
    console.log('Discord not configured — skipping message send');
    return false;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          content: content.substring(0, 2000), // Discord message limit
        }),
      },
    );

    if (!response.ok) {
      const error: DiscordAPIError = await response.json().catch(() => ({ message: 'Unknown error', code: 0 }));
      console.error('Discord send error:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Discord API send failed:', error);
    return false;
  }
}

export async function sendBotMessage(userMessage: string, aiResponse: string): Promise<boolean> {
  if (!isDiscordConfigured()) return false;

  // Send a formatted summary to Discord
  const formatted = `**👤 User:** ${userMessage.substring(0, 500)}\n\n**🤖 HexaGon AI:** ${aiResponse.substring(0, 1500)}`;
  return sendDiscordMessage(formatted);
}

export function getDiscordStatus(): {
  configured: boolean;
  channelId: string;
  hasBotToken: boolean;
} {
  return {
    configured: isDiscordConfigured(),
    channelId: DISCORD_CHANNEL_ID ? `#${DISCORD_CHANNEL_ID}` : 'Not set',
    hasBotToken: !!DISCORD_BOT_TOKEN,
  };
}
