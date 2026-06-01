// Diana AI — Discord Bridge
// Routes PWA chat messages through Discord so Diana bot can respond
// Architecture: PWA → API Route → Discord Webhook → Diana Bot responds → Poll for response → Stream back

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '1498728892150714509';
const DISCORD_BOT_ID = process.env.DISCORD_BOT_ID || '1497889229601247283';
const BRIDGE_WEBHOOK_ID = process.env.BRIDGE_WEBHOOK_ID || '';
const BRIDGE_WEBHOOK_TOKEN = process.env.BRIDGE_WEBHOOK_TOKEN || '';

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
  reference?: {
    message_id: string;
  };
}

interface WebhookMessage {
  id: string;
  content: string;
  username: string;
}

const BASE = 'https://discord.com/api/v10';

function botHeaders(): Record<string, string> {
  return {
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'DianaAI-PWA-Bridge/1.0',
  };
}

function webhookHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'DianaAI-PWA-Bridge/1.0',
  };
}

function isConfigured(): boolean {
  return !!(DISCORD_BOT_TOKEN && DISCORD_CHANNEL_ID);
}

function hasWebhook(): boolean {
  return !!(BRIDGE_WEBHOOK_ID && BRIDGE_WEBHOOK_TOKEN);
}

/**
 * Create or find a webhook in the channel for the bridge
 */
export async function ensureBridgeWebhook(): Promise<{ webhookId: string; webhookToken: string } | null> {
  if (!isConfigured()) return null;

  // Check if webhook is already configured via env
  if (hasWebhook()) {
    return { webhookId: BRIDGE_WEBHOOK_ID, webhookToken: BRIDGE_WEBHOOK_TOKEN };
  }

  try {
    // List existing webhooks in the channel
    const res = await fetch(`${BASE}/channels/${DISCORD_CHANNEL_ID}/webhooks`, {
      headers: botHeaders(),
    });

    if (res.ok) {
      const webhooks: Array<{ id: string; token: string; name: string }> = await res.json();
      const existing = webhooks.find(w => w.name === 'Diana PWA Bridge');
      if (existing) {
        return { webhookId: existing.id, webhookToken: existing.token };
      }
    }

    // Create a new webhook
    const createRes = await fetch(`${BASE}/channels/${DISCORD_CHANNEL_ID}/webhooks`, {
      method: 'POST',
      headers: botHeaders(),
      body: JSON.stringify({
        name: 'Diana PWA Bridge',
        avatar: null,
      }),
    });

    if (createRes.ok) {
      const webhook = await createRes.json();
      return { webhookId: webhook.id, webhookToken: webhook.token };
    }

    console.error('Failed to create webhook:', await createRes.text());
    return null;
  } catch (error) {
    console.error('Webhook setup error:', error);
    return null;
  }
}

/**
 * Send user message via Discord webhook (appears as "PWA User")
 */
export async function sendBridgeMessage(
  webhookId: string,
  webhookToken: string,
  content: string
): Promise<string | null> {
  const url = `${BASE}/webhooks/${webhookId}/${webhookToken}`;

  try {
    const res = await fetch(`${url}?wait=true`, {
      method: 'POST',
      headers: webhookHeaders(),
      body: JSON.stringify({
        content: content.substring(0, 2000),
        username: 'Diana PWA User',
        avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      }),
    });

    if (res.ok) {
      const msg: WebhookMessage = await res.json();
      return msg.id;
    }

    console.error('Webhook send failed:', await res.text());
    return null;
  } catch (error) {
    console.error('Bridge send error:', error);
    return null;
  }
}

/**
 * Poll for Diana bot's response to the bridge message
 * Returns the bot's response content
 */
export async function pollForDianaResponse(
  afterMessageId: string,
  timeoutMs: number = 45000,
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

      // Look for messages from Diana bot that reference our webhook message
      for (const msg of messages) {
        if (msg.author.bot && msg.author.id === DISCORD_BOT_ID) {
          // Diana responded! Collect full response (might be multi-message)
          let fullResponse = msg.content;

          // Check for follow-up messages (Diana might split long responses)
          const laterMessages = await fetchLaterMessages(msg.id, timeoutMs - (Date.now() - startTime));
          for (const later of laterMessages) {
            fullResponse += '\n\n' + later;
          }

          return fullResponse;
        }
        // Update last seen message ID
        if (msg.id > lastMessageId) {
          lastMessageId = msg.id;
        }
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  }

  return null; // Timeout
}

/**
 * Fetch additional messages from Diana after the first response message
 * (in case Diana sends follow-up messages for long responses)
 */
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
        m => m.author.bot && m.author.id === DISCORD_BOT_ID
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
 * Full bridge flow: send message via webhook, poll for Diana's response
 * Returns Diana's response text or null on failure
 */
export async function bridgeChat(userMessage: string): Promise<string | null> {
  // Step 1: Ensure webhook exists
  const webhook = await ensureBridgeWebhook();
  if (!webhook) {
    console.error('Discord bridge: webhook not available');
    return null;
  }

  // Step 2: Send user message via webhook
  const messageId = await sendBridgeMessage(webhook.webhookId, webhook.webhookToken, userMessage);
  if (!messageId) {
    console.error('Discord bridge: failed to send message');
    return null;
  }

  console.log(`Discord bridge: message sent (${messageId}), polling for Diana's response...`);

  // Step 3: Poll for Diana's response
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
  hasWebhook: boolean;
  channelId: string;
  botId: string;
} {
  return {
    configured: isConfigured(),
    hasWebhook: hasWebhook(),
    channelId: DISCORD_CHANNEL_ID,
    botId: DISCORD_BOT_ID,
  };
}
