import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Hitting /projects/[id]/chat → create a new conversation and redirect to it
export default async function ChatIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  const user = await getServerUser();
  if (!user) redirect('/login');

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== user.userId) redirect('/projects');

  const conversation = await prisma.conversation.create({
    data: { projectId, title: null },
  });

  redirect(`/projects/${projectId}/chat/${conversation.id}`);
}
