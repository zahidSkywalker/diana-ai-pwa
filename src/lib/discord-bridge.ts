// Echo AI — Discord Bridge
// Users chat in the PWA. Behind the scenes, messages go through Echo's Discord channel.
// Echo's AI brain (z.ai gateway) processes the message and responds.
// The PWA reads Echo's response and streams it back. Users never see Discord.
//
// Architecture:
//   PWA → API Route → webhook sends as "User" → Echo's gateway processes → Echo responds → PWA polls → SSE stream back

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '1511044432873656412';

// Echo's bot ID — derived from token (first segment is base64 bot ID)
const ECHO_BOT_ID = DISCORD_BOT_TOKEN
  ? Buffer.from(DISCORD_BOT_TOKEN.split('.')[0], 'base64').toString()
  : '1503694342634606682';

// Mention format to trigger Echo's z.ai gateway
const ECHO_MENTION = `<@${ECHO_BOT_ID}>`;

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
    'User-Agent': 'Echo-AI-PWA-Bridge/1.0',
  };
}

function isConfigured(): boolean {
  return !!(DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID);
}

// Cached webhook info (reused across requests)
let cachedWebhook: { id: string; token: string } | null = null;

/**
 * Get or create a webhook in the bridge channel.
 * Webhook messages appear as real user messages (not bot), so the
 * z.ai gateway picks them up and Echo responds naturally.
 */
async function ensureWebhook(): Promise<{ id: string; token: string } | null> {
  if (!isConfigured()) return null;
  if (cachedWebhook) return cachedWebhook;

  try {
    // Look for existing "Echo Bridge" webhook
    const res = await fetch(`${BASE}/channels/${DISCORD_CHANNEL_ID}/webhooks`, {
      headers: botHeaders(),
    });

    if (res.ok) {
      const webhooks: Array<{ id: string; token: string; name: string }> = await res.json();
      const existing = webhooks.find(w => w.name === 'Echo Bridge');
      if (existing) {
        cachedWebhook = { id: existing.id, token: existing.token };
        return cachedWebhook;
      }
    }

    // Create new webhook
    const createRes = await fetch(`${BASE}/channels/${DISCORD_CHANNEL_ID}/webhooks`, {
      method: 'POST',
      headers: botHeaders(),
      body: JSON.stringify({ name: 'Echo Bridge' }),
    });

    if (createRes.ok) {
      const webhook = await createRes.json();
      cachedWebhook = { id: webhook.id, token: webhook.token };
      return cachedWebhook;
    }

    console.error('Webhook creation failed:', await createRes.text());
    return null;
  } catch (error) {
    console.error('Webhook setup error:', error);
    return null;
  }
}

/**
 * Send user message via webhook (appears as "PWA User", not a bot).
 * Prepends @Echo mention so her z.ai gateway picks it up and responds.
 * The content is sent as: "<@bot_id> actual user message"
 */
async function sendViaWebhook(content: string): Promise<string | null> {
  const webhook = await ensureWebhook();
  if (!webhook) {
    console.error('Discord bridge: no webhook available');
    return null;
  }

  // Prepend @Echo mention to trigger her gateway, then the actual message
  const mentionContent = `${ECHO_MENTION} ${content}`;
  // Discord 2000 char limit — leave room for the mention
  const maxContent = 2000 - ECHO_MENTION.length - 1;
  const finalContent = mentionContent.substring(0, maxContent);

  try {
    const url = `${BASE}/webhooks/${webhook.id}/${webhook.token}?wait=true`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: finalContent,
        username: 'PWA User',
        avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      }),
    });

    if (res.ok) {
      const msg: DiscordMessage = await res.json();
      return msg.id;
    }

    console.error('Webhook send failed:', await res.text());
    return null;
  } catch (error) {
    console.error('Webhook send error:', error);
    return null;
  }
}

/**
 * Poll for Echo bot's response after our webhook message
 */
async function pollForResponse(
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
        if (msg.author.bot && msg.author.id === ECHO_BOT_ID) {
          // Strip any echo mention from the response
          let fullResponse = msg.content.replace(/<@\d+>\s*/g, '').trim();

          // Collect follow-up messages (Echo may split long responses)
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
        m => m.author.bot && m.author.id === ECHO_BOT_ID
      );

      if (botMessages.length === 0) break;

      for (const msg of botMessages) {
        // Strip any mention tags from follow-up messages too
        contents.push(msg.content.replace(/<@\d+>\s*/g, '').trim());
        if (msg.id > lastId) lastId = msg.id;
      }
    } catch {
      break;
    }
  }

  return contents;
}

/**
 * Full bridge flow:
 * 1. Send user message via webhook (appears as "PWA User")
 * 2. Echo's gateway processes and responds
 * 3. Poll for Echo's response
 * 4. Return response text
 */
export async function bridgeChat(userMessage: string): Promise<string | null> {
  const messageId = await sendViaWebhook(userMessage);
  if (!messageId) {
    console.error('Discord bridge: failed to send webhook message');
    return null;
  }

  console.log(`Discord bridge: webhook sent (${messageId}), polling for Echo...`);

  const response = await pollForResponse(messageId);
  if (!response) {
    console.error('Discord bridge: timed out waiting for Echo');
    return null;
  }

  console.log(`Discord bridge: Echo responded (${response.length} chars)`);
  return response;
}

export function getBridgeStatus(): {
  configured: boolean;
  channelId: string;
  botId: string;
} {
  return {
    configured: isConfigured(),
    channelId: DISCORD_CHANNEL_ID,
    botId: ECHO_BOT_ID,
  };
}
