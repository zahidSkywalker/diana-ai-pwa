import { NextResponse } from 'next/server';

// Stats endpoint — works with or without database
export async function GET() {
  try {
    const { db } = await import('@/lib/db');

    const totalConversations = await db.conversation.count().catch(() => 0);
    const totalMessages = await db.message.count().catch(() => 0);
    const totalDocuments = await db.document.count().catch(() => 0);
    const totalBooks = await db.book.count().catch(() => 0);
    const totalKnowledgeBases = await db.knowledgeBase.count().catch(() => 0);
    const totalKBEntries = await db.kBEntry.count().catch(() => 0);

    const recentConversations = await db.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, mode: true, createdAt: true },
    }).catch(() => []);

    const recentDocuments = await db.document.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, updatedAt: true },
    }).catch(() => []);

    const recentBooks = await db.book.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, progress: true, createdAt: true },
    }).catch(() => []);

    let stats = await db.userStats.findFirst().catch(() => null);
    if (!stats) {
      stats = await db.userStats.create({
        data: {
          totalChats: totalConversations,
          totalQuizzes: 0,
          totalBooks: totalBooks,
          questionsAsked: totalMessages,
        },
      }).catch(() => ({
        id: 'placeholder',
        totalChats: 0,
        totalQuizzes: 0,
        totalBooks: 0,
        questionsAsked: 0,
        lastActive: new Date().toISOString(),
      }));
    } else {
      await db.userStats.update({
        where: { id: stats.id },
        data: {
          totalChats: totalConversations,
          totalBooks: totalBooks,
          questionsAsked: totalMessages,
          lastActive: new Date(),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      stats,
      totalConversations,
      totalMessages,
      totalDocuments,
      totalBooks,
      totalKnowledgeBases,
      totalKBEntries,
      recentConversations,
      recentDocuments,
      recentBooks,
    });
  } catch (error) {
    console.error('Stats error:', error);
    // Return empty stats as fallback for serverless environments
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
