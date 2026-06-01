// Echo AI — Discord Bridge (via Python Relay Bot)
// Users chat in the PWA. Messages go to a Python relay bot.
// The relay bot sends @Echo in #echo. Echo responds. Bot returns response.
// PWA streams it back. Users never see Discord.
//
// Architecture:
//   PWA → Vercel API → Python Bridge Bot → @Echo in #echo → Echo responds → Bot returns → PWA streams

const BRIDGE_URL = process.env.BRIDGE_URL || '';
const BRIDGE_AUTH_TOKEN = process.env.BRIDGE_AUTH_TOKEN || 'echo-bridge-2026-secret';

interface BridgeResponse {
  content: string | null;
  status: 'ok' | 'timeout';
}

interface AIEngineStatus {
  configured: boolean;
  engine: string;
  bridgeUrl: string;
}

export function getBridgeStatus(): AIEngineStatus {
  return {
    configured: !!BRIDGE_URL,
    engine: 'bridge-bot',
    bridgeUrl: BRIDGE_URL ? BRIDGE_URL.replace(/\/\/.*@/, '//***@') : '',
  };
}

/**
 * Send message through the Python relay bot and get Echo's response.
 * Direct fetch — no Discord SDK needed on Vercel.
 */
export async function bridgeChat(userMessage: string): Promise<string | null> {
  if (!BRIDGE_URL) {
    console.error('Bridge: no BRIDGE_URL configured');
    return null;
  }

  try {
    const res = await fetch(`${BRIDGE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIDGE_AUTH_TOKEN}`,
      },
      body: JSON.stringify({ message: userMessage.substring(0, 1900) }),
    });

    if (!res.ok) {
      console.error('Bridge: HTTP error', res.status, await res.text());
      return null;
    }

    const data: BridgeResponse = await res.json();

    if (data.content) {
      console.log(`Bridge: Echo responded (${data.content.length} chars)`);
      return data.content;
    }

    if (data.status === 'timeout') {
      console.error('Bridge: timed out waiting for Echo');
    }

    return null;
  } catch (error: any) {
    console.error('Bridge error:', error?.message || error);
    return null;
  }
}
