import Link from 'next/link';
import { Plus, Bot } from 'lucide-react';
import { getServerUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const projects = await prisma.project.findMany({
    where: { userId: user.userId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { conversations: true, files: true } } },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-retro-gradient">Your agents</span>
          </h1>
          <p className="text-retro-dim text-sm mt-2">
            {projects.length === 0
              ? 'Create your first AI agent to get started'
              : `${projects.length} agent${projects.length !== 1 ? 's' : ''} ready to talk`}
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-retro-border bg-retro-surface/50 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-avatar-gradient mb-5">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-retro-text mb-2">No agents yet</h2>
          <p className="text-retro-dim text-sm mb-7 max-w-sm">
            Create an AI agent with a custom system prompt, choose a model, and start chatting.
          </p>
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4" />
              Create your first agent
            </Button>
          </Link>
        </div>
      )}

      {/* Grid */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
