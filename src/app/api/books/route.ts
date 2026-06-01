import { NextRequest, NextResponse } from 'next/server';
import { mistralChat } from '@/lib/mistral';

export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    const books = await db.book.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        chapters: { orderBy: { order: 'asc' } },
      },
    });
    return NextResponse.json(books);
  } catch (error) {
    console.error('GET books error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { topic, title } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Generate book structure with Mistral AI
    const completion = await mistralChat([
      {
        role: 'system',
        content: `You are a structured book content generator. Generate a comprehensive book outline with 5-8 chapters for the given topic.
Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{"title": "Book Title Here", "chapters": [{"title": "Chapter 1 Title", "summary": "Brief summary", "content": "Full chapter content in markdown with sections, key points, and examples. Make it educational and thorough (at least 300 words per chapter)."}]}
Ensure the content is educational, well-structured, and uses markdown formatting (headers, lists, bold text, code blocks where relevant).`,
      },
      {
        role: 'user',
        content: `Generate a comprehensive learning book about: ${topic}. ${title ? `Suggested title: ${title}` : ''}`,
      },
    ]);

    const responseText = (completion as any).choices?.[0]?.message?.content || '';
    let cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let bookData;
    try {
      bookData = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json({ error: 'Failed to generate book structure. Please try again.' }, { status: 500 });
    }

    try {
      const { db } = await import('@/lib/db');
      const book = await db.book.create({
        data: {
          title: bookData.title || title || topic,
          topic: topic,
          chapters: {
            create: (bookData.chapters || []).map((ch: any, i: number) => ({
              title: ch.title || `Chapter ${i + 1}`,
              content: ch.content || '',
              order: i,
            })),
          },
        },
        include: { chapters: { orderBy: { order: 'asc' } } },
      });
      return NextResponse.json(book);
    } catch {
      // Fallback for serverless: return generated book without saving
      const bookId = crypto.randomUUID ? crypto.randomUUID() : `book_${Date.now()}`;
      return NextResponse.json({
        id: bookId,
        title: bookData.title || title || topic,
        topic: topic,
        progress: 0,
        createdAt: new Date().toISOString(),
        chapters: (bookData.chapters || []).map((ch: any, i: number) => ({
          id: `${bookId}_ch_${i}`,
          title: ch.title || `Chapter ${i + 1}`,
          content: ch.content || '',
          order: i,
        })),
      });
    }
  } catch (error) {
    console.error('POST books error:', error);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Book ID required' }, { status: 400 });
    try {
      const { db } = await import('@/lib/db');
      await db.book.delete({ where: { id } });
    } catch {}
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE book error:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
