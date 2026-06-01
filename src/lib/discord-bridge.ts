// Diana AI — Discord Bridge
// Routes PWA chat messages through Discord so Diana bot can respond
// Architecture: PWA → API Route → Echo bot sends message → Diana Bot responds → Poll for response → Stream back

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '1511044432873656412';
// Diana bot ID — the bot that actually responds to messages
const DIANA_BOT_ID = process.env.DIANA_BOT_ID || '1497889229601247283';

interface DiscordMessage {
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

const BASE = 'https://discord.com/api/v10';

function botHeaders(): Record<string, string> {
  return {
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'DianaAI-PWA-Bridge/1.0',
  };
}

function isConfigured(): boolean {
  return !!(DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID);
}

/**
 * Send user message as Echo bot directly in the channel
 * Diana bot sees it and responds
 */
export async function sendBridgeMessage(content: string): Promise<string | null> {
  if (!isConfigured()) return null;

  try {
    const res = await fetch(`${BASE}/channels/${DISCORD_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: botHeaders(),
      body: JSON.stringify({
        content: content.substring(0, 2000),
      }),
    });

    if (res.ok) {
      const msg: DiscordMessage = await res.json();
      return msg.id;
    }

    console.error('Bridge send failed:', await res.text());
    return null;
  } catch (error) {
    console.error('Bridge send error:', error);
    return null;
  }
}

/**
 * Poll for Diana bot's response after our message
 */
export async function pollForDianaResponse(
  afterMessageId: string,
  timeoutMs: number = 60000,
  pollIntervalMs: number = 2000
): Promise<string | null> {
  if (!isConfigured()) return null;

  const startTime = Date.now();
  let lastMessageId = afterMessageId;

  while (Date.now() - startTime < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

    try {
      const url = `${BASE}/channels/${DISCORD_CHANNEL_ID}/messages?after=${lastMessageId}&limit=10`;
      const res = await fetch(url, { headers: botHeaders() });

      if (!res.ok) continue;

      const messages: DiscordMessage[] = await res.json();

      for (const msg of messages) {
        if (msg.author.bot && msg.author.id === DIANA_BOT_ID) {
          // Diana responded!
          let fullResponse = msg.content;

          // Check for follow-up messages
          const laterMessages = await fetchLaterMessages(msg.id, timeoutMs - (Date.now() - startTime));
          for (const later of laterMessages) {
            fullResponse += '\n\n' + later;
          }

          return fullResponse;
        }
        if (msg.id > lastMessageId) {
          lastMessageId = msg.id;
        }
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  }

  return null;
}

async function fetchLaterMessages(
  afterMessageId: string,
  remainingTimeMs: number
): Promise<string[]> {
  const contents: string[] = [];
  const startTime = Date.now();
  let lastId = afterMessageId;

  while (Date.now() - startTime < Math.min(remainingTimeMs, 15000)) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const url = `${BASE}/channels/${DISCORD_CHANNEL_ID}/messages?after=${lastId}&limit=5`;
      const res = await fetch(url, { headers: botHeaders() });
      if (!res.ok) break;

      const messages: DiscordMessage[] = await res.json();
      const botMessages = messages.filter(
        m => m.author.bot && m.author.id === DIANA_BOT_ID
      );

      if (botMessages.length === 0) break;

      for (const msg of botMessages) {
        contents.push(msg.content);
        if (msg.id > lastId) lastId = msg.id;
      }
    } catch {
      break;
    }
  }

  return contents;
}

/**
 * Full bridge flow: send message via Echo bot, poll for Diana's response
 */
export async function bridgeChat(userMessage: string): Promise<string | null> {
  // Step 1: Send user message as Echo bot
  const messageId = await sendBridgeMessage(userMessage);
  if (!messageId) {
    console.error('Discord bridge: failed to send message');
    return null;
  }

  console.log(`Discord bridge: message sent (${messageId}), polling for Diana's response...`);

  // Step 2: Poll for Diana's response
  const response = await pollForDianaResponse(messageId);
  if (!response) {
    console.error('Discord bridge: timed out waiting for Diana');
    return null;
  }

  console.log(`Discord bridge: Diana responded (${response.length} chars)`);
  return response;
}

export function getBridgeStatus(): {
  configured: boolean;
  channelId: string;
  dianaBotId: string;
} {
  return {
    configured: isConfigured(),
    channelId: DISCORD_CHANNEL_ID,
    dianaBotId: DIANA_BOT_ID,
  };
}
