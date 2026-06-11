import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Plus } from 'lucide-react';
import { getServerUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import type { Message } from '@/types';

interface PageProps {
  params: Promise<{ id: string; conversationId: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { id: projectId, conversationId } = await params;

  const user = await getServerUser();
  if (!user) redirect('/login');

  const [conversation, conversations] = await Promise.all([
    prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          select: { id: true, name: true, systemPrompt: true, model: true, userId: true },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.conversation.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
    }),
  ]);

  if (!conversation || conversation.project.userId !== user.userId) {
    redirect(`/projects/${projectId}`);
  }

  const messages: Message[] = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    conversationId: m.conversationId,
    createdAt: m.createdAt,
  }));

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sidebar */}
      <ConversationSidebar
        projectId={projectId}
        projectName={conversation.project.name}
        conversations={conversations}
        activeConversationId={conversationId}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-retro-border/50 bg-retro-bg">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}`} className="md:hidden text-retro-dim hover:text-retro-text">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="font-semibold text-retro-text text-sm">
                {conversation.title || 'New conversation'}
              </h2>
              <p className="text-xs text-retro-dim">{conversation.project.model}</p>
            </div>
          </div>
          <Link href={`/projects/${projectId}`} className="text-retro-dim hover:text-retro-muted">
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            conversationId={conversationId}
            projectName={conversation.project.name}
            initialMessages={messages}
          />
        </div>
      </div>
    </div>
  );
}
