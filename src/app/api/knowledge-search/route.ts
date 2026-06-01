import { NextRequest, NextResponse } from 'next/server';
import { mistralChat } from '@/lib/mistral';

export async function POST(req: NextRequest) {
  try {
    const { query, knowledgeBaseId, context: providedContext } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    let context = providedContext || '';

    // Try to get entries from database if context not provided
    if (!context && knowledgeBaseId) {
      try {
        const { db } = await import('@/lib/db');
        const entries = await db.kBEntry.findMany({
          where: { knowledgeBaseId },
        });

        if (entries.length === 0) {
          return NextResponse.json({
            answer: 'This knowledge base is empty, Sir. Please add some content first.',
          });
        }

        context = entries
          .map((e) => `--- ${e.title} ---\n${e.content}`)
          .join('\n\n');
      } catch {
        context = 'No knowledge base content available (running in serverless mode).';
      }
    }

    const completion = await mistralChat([
      {
        role: 'system',
        content: `You are JARVIS, an AI knowledge assistant. You address the user as "Sir".
Answer questions based ONLY on the provided knowledge base content. If the answer is not in the knowledge base, say so.
Use markdown formatting for better readability. Be thorough but concise.`,
      },
      {
        role: 'user',
        content: `Knowledge Base Content:\n${context}\n\nQuestion: ${query}`,
      },
    ]);

    const answer = (completion as any).choices?.[0]?.message?.content || 'I could not find an answer, Sir.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json({ error: 'Failed to search knowledge base' }, { status: 500 });
  }
}
