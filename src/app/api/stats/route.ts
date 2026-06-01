import { NextResponse } from 'next/server';
import { getConversations } from '@/lib/supabase-server';

// Stats endpoint — works with Supabase
export async function GET() {
  try {
    const conversations = await getConversations();
    const totalConversations = conversations.length;

    return NextResponse.json({
      stats: {
        id: 'diana-stats',
        totalChats: totalConversations,
        totalQuizzes: 0,
        totalBooks: 0,
        questionsAsked: 0,
        lastActive: new Date().toISOString(),
      },
      totalConversations,
      totalMessages: 0,
      totalDocuments: 0,
      totalBooks: 0,
      totalKnowledgeBases: 0,
      totalKBEntries: 0,
      recentConversations: conversations.slice(0, 5).map(c => ({
        id: c.id,
        title: c.title,
        mode: 'chat',
        createdAt: c.createdAt,
      })),
      recentDocuments: [],
      recentBooks: [],
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({
      stats: { id: 'fallback', totalChats: 0, totalQuizzes: 0, totalBooks: 0, questionsAsked: 0, lastActive: new Date().toISOString() },
      totalConversations: 0,
      totalMessages: 0,
      totalDocuments: 0,
      totalBooks: 0,
      totalKnowledgeBases: 0,
      totalKBEntries: 0,
      recentConversations: [],
      recentDocuments: [],
      recentBooks: [],
    });
  }
}
