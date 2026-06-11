import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { conversations: true, files: true } },
    },
  });

  return NextResponse.json({ success: true, data: { projects } });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { name, description, systemPrompt, model } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      systemPrompt: systemPrompt?.trim() || 'You are a helpful assistant.',
      model: model || 'gpt-4o-mini',
      userId: user.userId,
    },
    include: {
      _count: { select: { conversations: true, files: true } },
    },
  });

  return NextResponse.json({ success: true, data: { project } }, { status: 201 });
}
