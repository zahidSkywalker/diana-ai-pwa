// HexaGon AI — Gemini API helper (Diana's brain)
// Unified Gemini backend for all AI operations

import { ChatMessage, SYSTEM_PROMPT, DEFAULT_MODEL } from './hexagon-types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBrbaZCpCwYcX0Wot1CyI-yF7Sr0brZc30';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

interface APIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function getModel(model: string): string {
  const modelMap: Record<string, string> = {
    'gemini-flash': 'gemini-2.0-flash',
    'gemini-pro': 'gemini-1.5-pro',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'glm-4-flash': 'gemini-2.0-flash',
    'glm-4-plus': 'gemini-1.5-pro',
    'glm-4-long': 'gemini-1.5-pro',
  };
  return modelMap[model] || DEFAULT_MODEL;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL,
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<Response> {
  const resolvedModel = getModel(model);
  const chatMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents: chatMessages,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const url = `${GEMINI_BASE_URL}/models/${resolvedModel}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error (${response.status}):`, errorText);
    throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
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
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
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
  const resolvedModel = getModel(model);
  const chatMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents: chatMessages,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const url = `${GEMINI_BASE_URL}/models/${resolvedModel}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error (${response.status}):`, errorText);
    throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
