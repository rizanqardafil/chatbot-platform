'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Plus, ArrowLeft, Settings } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
}

interface ConversationSidebarProps {
  projectId: string;
  projectName: string;
  conversations: Conversation[];
  activeConversationId: string;
}

export function ConversationSidebar({
  projectId,
  projectName,
  conversations,
  activeConversationId,
}: ConversationSidebarProps) {
  const router = useRouter();

  const handleNewChat = async () => {
    const res = await fetch(`/api/projects/${projectId}/conversations`, { method: 'POST' });
    const data = await res.json();
    router.push(`/projects/${projectId}/chat/${data.data.conversation.id}`);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-retro-border/50 bg-[#222229] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-retro-border/50">
        <Link
          href={`/projects/${projectId}`}
          className="flex items-center gap-2 text-retro-muted hover:text-retro-text transition-colors min-w-0"
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate">{projectName}</span>
        </Link>
        <Link href={`/projects/${projectId}`} className="text-retro-dim hover:text-retro-muted ml-2">
          <Settings className="h-4 w-4" />
        </Link>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          new conversation
        </Button>
      </div>

      {/* Conversations list */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
        {conversations.length === 0 && (
          <p className="text-center text-xs text-retro-dim py-4">No conversations yet</p>
        )}
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            href={`/projects/${projectId}/chat/${conv.id}`}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors mb-0.5',
              conv.id === activeConversationId
                ? 'bg-retro-surface2 text-retro-text'
                : 'text-retro-dim hover:bg-retro-surface hover:text-retro-muted'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{conv.title || 'New conversation'}</p>
              <p className="text-[10px] text-retro-dim">{formatDate(conv.updatedAt)}</p>
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
