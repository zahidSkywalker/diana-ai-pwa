import { NextRequest, NextResponse } from 'next/server';
import { bridgeChat, getBridgeStatus } from '@/lib/discord-bridge';

export async function POST(req: NextRequest) {
  try {
    const { query, context: providedContext } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const status = getBridgeStatus();
    if (!status.configured) {
      return NextResponse.json({
        answer: "Diana's knowledge system is being configured. Please try again shortly.",
      });
    }

    const context = providedContext || 'No knowledge base content available.';
    const prompt = `[Knowledge Base Content]:\n${context}\n\n[Question]: ${query}`;

    const response = await bridgeChat(prompt);
    const answer = response || 'I could not find an answer.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json({ error: 'Failed to search knowledge base' }, { status: 500 });
  }
}
