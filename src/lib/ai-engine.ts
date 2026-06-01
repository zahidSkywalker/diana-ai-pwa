// Echo AI — Direct AI Engine
// No Discord. No webhooks. No polling.
// Every input goes directly to the AI via z-ai-web-dev-sdk and comes straight back.
// PWA user types → API route → z.ai SDK → response streams back. Clean.

let _zai: any = null;

async function getZAI() {
  if (!_zai) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    _zai = await ZAI.create();
  }
  return _zai;
}

interface AIEngineStatus {
  configured: boolean;
  engine: string;
}

export function getEngineStatus(): AIEngineStatus {
  return {
    configured: true, // z-ai-web-dev-sdk is always available
    engine: 'z-ai-direct',
  };
}

/**
 * Send messages directly to the AI and get a text response.
 * No Discord, no bridge, no polling — direct SDK call.
 */
export async function aiChat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<string | null> {
  try {
    const zai = await getZAI();

    const apiMessages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      apiMessages.push({ role: msg.role, content: msg.content });
    }

    const completion = await zai.chat.completions.create({
      messages: apiMessages,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (content) {
      console.log(`AI engine: responded (${content.length} chars)`);
      return content;
    }

    console.error('AI engine: empty response');
    return null;
  } catch (error: any) {
    console.error('AI engine error:', error?.message || error);
    return null;
  }
}
