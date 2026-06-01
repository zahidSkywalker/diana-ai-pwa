import { NextRequest, NextResponse } from 'next/server';
import { mistralChat } from '@/lib/mistral';

export async function POST(req: NextRequest) {
  try {
    const { query, context: providedContext } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    let context = providedContext || 'No knowledge base content available.';

    const completion = await mistralChat([
      {
        role: 'system',
        content: `You are Diana AI, a knowledge assistant. Answer questions based on the provided knowledge base content. If the answer is not in the knowledge base, say so. Use markdown formatting.`,
      },
      {
        role: 'user',
        content: `Knowledge Base Content:\n${context}\n\nQuestion: ${query}`,
      },
    ]);

    const answer = (completion as any).choices?.[0]?.message?.content || 'I could not find an answer.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json({ error: 'Failed to search knowledge base' }, { status: 500 });
  }
}
