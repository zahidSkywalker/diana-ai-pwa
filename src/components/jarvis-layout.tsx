'use client';

import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { ChatModule } from '@/components/modules/chat-module';
import { CoWriterModule } from '@/components/modules/cowriter-module';
import { BooksModule } from '@/components/modules/books-module';
import { KnowledgeModule } from '@/components/modules/knowledge-module';
import { SpaceModule } from '@/components/modules/space-module';
import { useAppStore } from '@/lib/store';

export function JarvisLayout() {
  const { activeModule } = useAppStore();

  const renderModule = () => {
    switch (activeModule) {
      case 'chat':
        return <ChatModule />;
      case 'cowriter':
        return <CoWriterModule />;
      case 'books':
        return <BooksModule />;
      case 'knowledge':
        return <KnowledgeModule />;
      case 'space':
        return <SpaceModule />;
      default:
        return <ChatModule />;
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-hidden pb-14 lg:pb-0">
          <div className="module-transition h-full">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}
