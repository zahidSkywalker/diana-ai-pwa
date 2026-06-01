// HexaGon AI — GLM-4 / Mistral API helper using OpenAI-compatible format

import { ChatMessage, SYSTEM_PROMPT, DEFAULT_MODEL } from './hexagon-types';

const GLM_API_URL = process.env.GLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = process.env.GLM_API_KEY || '';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '0nmyNyMGwClhJWXFIimzDVM4ZjZD67Ni';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

interface APIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function getEndpoint(model: string): { url: string; apiKey: string; mappedModel: string } {
  if (model.startsWith('glm-')) {
    if (!GLM_API_KEY) {
      throw new Error('GLM_API_KEY is not configured. Falling back to Mistral.');
    }
    return { url: GLM_API_URL, apiKey: GLM_API_KEY, mappedModel: model };
  }
  if (!MISTRAL_API_KEY) {
    throw new Error('No AI API key configured. Please set GLM_API_KEY or MISTRAL_API_KEY.');
  }
  const modelMap: Record<string, string> = {
    'mistral-small': 'mistral-small-latest',
    'mistral-medium': 'mistral-medium-latest',
  };
  return {
    url: MISTRAL_API_URL,
    apiKey: MISTRAL_API_KEY,
    mappedModel: modelMap[model] || 'mistral-small-latest',
  };
}

export async function sendChatMessage(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL,
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<Response> {
  const { url, apiKey, mappedModel } = getEndpoint(model);

  const apiMessages: APIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: mappedModel,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI API error (${response.status}):`, errorText);
    throw new Error(`AI API returned ${response.status}: ${errorText}`);
  }

  return response;
}

export function createSSEStream(response: Response): ReadableStream {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      try {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
                );
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('SSE stream error:', error);
        controller.error(error);
      }
    },
  });
}

export async function sendChatMessageNonStream(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL,
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<string> {
  const { url, apiKey, mappedModel } = getEndpoint(model);

  const apiMessages: APIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: mappedModel,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI API error (${response.status}):`, errorText);
    throw new Error(`AI API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
