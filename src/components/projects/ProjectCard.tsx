import Link from 'next/link';
import { MessageSquare, FileText, ChevronRight, Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project & { _count?: { conversations: number; files: number } };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group h-full transition-all hover:bg-retro-surface2 hover:border-retro-purple/40 cursor-pointer">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-avatar-gradient">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-retro-text truncate group-hover:text-white transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-retro-dim mt-0.5">
                  {formatDate(project.createdAt)}
                </p>
              </div>
            </div>
            <ChevronRight className="flex-shrink-0 h-4 w-4 text-retro-dim group-hover:text-retro-accent transition-colors mt-1" />
          </div>

          {project.description && (
            <p className="mt-3 text-sm text-retro-muted line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <Badge variant="warning">{project.model}</Badge>
            {project._count && (
              <>
                <span className="flex items-center gap-1 text-xs text-retro-dim">
                  <MessageSquare className="h-3 w-3" />
                  {project._count.conversations} chats
                </span>
                {project._count.files > 0 && (
                  <span className="flex items-center gap-1 text-xs text-retro-dim">
                    <FileText className="h-3 w-3" />
                    {project._count.files} files
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
