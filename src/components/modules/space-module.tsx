'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MessageSquare,
  FileText,
  BookOpen,
  Database,
  Brain,
  Activity,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalChats: number;
    totalQuizzes: number;
    totalBooks: number;
    questionsAsked: number;
    lastActive: string;
  };
  totalConversations: number;
  totalMessages: number;
  totalDocuments: number;
  totalBooks: number;
  totalKnowledgeBases: number;
  totalKBEntries: number;
  recentConversations: { id: string; title: string; mode: string; createdAt: string }[];
  recentDocuments: { id: string; title: string; updatedAt: string }[];
  recentBooks: { id: string; title: string; progress: number; createdAt: string }[];
}

export function SpaceModule() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const statCards = [
    { label: 'Chats', value: data?.totalConversations || 0, icon: <MessageSquare className="h-4 w-4" />, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    { label: 'Messages', value: data?.totalMessages || 0, icon: <Brain className="h-4 w-4" />, color: 'text-emerald-300', bgColor: 'bg-emerald-300/10' },
    { label: 'Docs', value: data?.totalDocuments || 0, icon: <FileText className="h-4 w-4" />, color: 'text-green-400', bgColor: 'bg-green-400/10' },
    { label: 'Books', value: data?.totalBooks || 0, icon: <BookOpen className="h-4 w-4" />, color: 'text-teal-400', bgColor: 'bg-teal-400/10' },
    { label: 'KBs', value: data?.totalKnowledgeBases || 0, icon: <Database className="h-4 w-4" />, color: 'text-lime-400', bgColor: 'bg-lime-400/10' },
    { label: 'Entries', value: data?.totalKBEntries || 0, icon: <BarChart3 className="h-4 w-4" />, color: 'text-green-300', bgColor: 'bg-green-300/10' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-[10px] text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 sm:p-4 max-w-4xl mx-auto space-y-3">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-primary font-medium uppercase tracking-wider">Dashboard</span>
            </div>
            <h2 className="text-lg font-bold">Welcome back, Sir</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Your learning journey with JARVIS at a glance.
            </p>
            {data?.stats.lastActive && (
              <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                Last active: {formatTime(data.stats.lastActive)}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-card/50 border-border hover:border-primary/20 transition-colors">
              <CardContent className="p-2 sm:p-3">
                <div className={`${stat.bgColor} ${stat.color} w-7 h-7 rounded-lg flex items-center justify-center mb-1.5`}>
                  {stat.icon}
                </div>
                <p className="text-base sm:text-lg font-bold">{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Recent Conversations */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-[11px] flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-1.5">
                {(data?.recentConversations || []).length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/50 text-center py-3">No conversations yet</p>
                ) : (
                  (data?.recentConversations || []).map((conv) => (
                    <div key={conv.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                      <MessageSquare className="h-3 w-3 text-primary/40 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{conv.title}</p>
                        <p className="text-[9px] text-muted-foreground">{formatTime(conv.createdAt)}</p>
                      </div>
                      <Badge variant="secondary" className="text-[8px] shrink-0 h-4 px-1">
                        {conv.mode}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-[11px] flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-1.5">
                {(data?.recentDocuments || []).length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/50 text-center py-3">No documents yet</p>
                ) : (
                  (data?.recentDocuments || []).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                      <FileText className="h-3 w-3 text-primary/40 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{doc.title}</p>
                        <p className="text-[9px] text-muted-foreground">{formatTime(doc.updatedAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Books */}
          <Card className="bg-card/50 border-border lg:col-span-2">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-[11px] flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Learning Books
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-1.5">
                {(data?.recentBooks || []).length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/50 text-center py-3">
                    No books created yet, Sir
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {(data?.recentBooks || []).map((book) => (
                      <div key={book.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                        <BookOpen className="h-3 w-3 text-primary/40 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate">{book.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Progress value={book.progress} className="h-1 flex-1" />
                            <span className="text-[9px] text-muted-foreground">{book.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Tip */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h4 className="text-[11px] font-medium">Learning Tip</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Use Quiz mode to test your knowledge, or generate interactive learning books on any topic. 
                  The more you engage with JARVIS, the better your personalized learning experience becomes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
