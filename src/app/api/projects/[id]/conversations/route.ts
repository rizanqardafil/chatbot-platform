import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== user.userId) {
    return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ success: true, data: { conversations } });
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== user.userId) {
    return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
  }

  const conversation = await prisma.conversation.create({
    data: {
      projectId,
      title: null,
    },
  });

  return NextResponse.json({ success: true, data: { conversation } }, { status: 201 });
}
