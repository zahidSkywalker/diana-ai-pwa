// Echo AI — Direct AI Engine
// No SDK. No Discord. No webhooks. No polling.
// Direct fetch to z.ai internal API. Works on Vercel serverless.

const ZAI_BASE_URL = 'https://internal-api.z.ai/v1';
const ZAI_API_KEY = 'Z.ai';
const ZAI_CHAT_ID = 'chat-1cf2d24a-022a-43d4-b89f-7c099f8d5584';
const ZAI_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTMwNzg0MTEtZWI0My00YTUwLTlkOTktNGM3ZGE1MGI4OWYwIiwiY2hhdF9pZCI6ImNoYXQtMWNmMmQyNGEtMDIyYS00M2Q0LWI4OWYtN2MwOTlmOGQ1NTg0IiwicGxhdGZvcm0iOiJ6YWkifQ.bvvibWEcP_36lirC0O1Q4D6Q0-rvr1b4fNA1Ua94zlk';
const ZAI_USER_ID = '53078411-eb43-4a50-9d99-4c7da50b89f0';

interface AIEngineStatus {
  configured: boolean;
  engine: string;
}

export function getEngineStatus(): AIEngineStatus {
  return {
    configured: true,
    engine: 'z-ai-direct',
  };
}

/**
 * Send messages directly to the z.ai API. No middleman.
 */
export async function aiChat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<string | null> {
  try {
    const apiMessages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      apiMessages.push({ role: msg.role, content: msg.content });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ZAI_API_KEY}`,
      'X-Chat-Id': ZAI_CHAT_ID,
      'X-User-Id': ZAI_USER_ID,
      'X-Token': ZAI_TOKEN,
    };

    const response = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      console.error('AI engine HTTP error:', response.status, await response.text());
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
      // Stream response — collect all chunks
      const text = await response.text();
      const content = text
        .split('\n')
        .filter(line => line.startsWith('data:'))
        .map(line => {
          try {
            const json = JSON.parse(line.slice(5).trim());
            return json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content || '';
          } catch {
            return '';
          }
        })
        .join('');
      if (content) {
        console.log(`AI engine: responded (${content.length} chars)`);
        return content;
      }
    } else {
      data = await response.json();
    }

    const content = data?.choices?.[0]?.message?.content;
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
