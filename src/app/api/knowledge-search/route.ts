import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai-engine';

const SYSTEM_PROMPT = `You are Echo AI Knowledge Search. Answer questions based on the provided knowledge base content. Be accurate and cite the relevant parts of the content in your answer.`;

export async function POST(req: NextRequest) {
  try {
    const { query, context: providedContext } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const context = providedContext || 'No knowledge base content available.';
    const prompt = `[Knowledge Base Content]:\n${context}\n\n[Question]: ${query}`;

    const response = await aiChat([{ role: 'user', content: prompt }], SYSTEM_PROMPT);
    const answer = response || 'I could not find an answer.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json({ error: 'Failed to search knowledge base' }, { status: 500 });
  }
}
