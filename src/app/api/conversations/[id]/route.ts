import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      project: { select: { userId: true, name: true, systemPrompt: true, model: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!conversation || conversation.project.userId !== user.userId) {
    return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { conversation } });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });

  if (!conversation || conversation.project.userId !== user.userId) {
    return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
  }

  await prisma.conversation.delete({ where: { id } });

  return NextResponse.json({ success: true, message: 'Conversation deleted' });
}
