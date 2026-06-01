import { NextRequest, NextResponse } from 'next/server';
import { bridgeChat } from '@/lib/discord-bridge';

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const { topic, title } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `[Generate a book]: Generate a comprehensive book outline with 5-8 chapters about: ${topic}${title ? `. Suggested title: ${title}` : ''}.
Return ONLY valid JSON in this exact format:
{"title": "Book Title Here", "chapters": [{"title": "Chapter 1 Title", "summary": "Brief summary", "content": "Full chapter content in markdown. At least 300 words per chapter."}]}`;

    const response = await bridgeChat(prompt);
    if (!response) {
      return NextResponse.json({ error: 'Failed to generate book. Please try again.' }, { status: 500 });
    }

    let cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let bookData;
    try {
      bookData = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json({ error: 'Failed to parse book structure. Please try again.' }, { status: 500 });
    }

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
  } catch (error) {
    console.error('POST books error:', error);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ success: true });
}
