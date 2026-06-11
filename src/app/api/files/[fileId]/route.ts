import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteOpenAIFile } from '@/lib/openai';

type Params = Promise<{ fileId: string }>;

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { fileId } = await params;

  const file = await prisma.projectFile.findUnique({
    where: { id: fileId },
    include: { project: { select: { userId: true, vectorStoreId: true } } },
  });

  if (!file || file.project.userId !== user.userId) {
    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
  }

  await deleteOpenAIFile(file.openaiFileId, file.project.vectorStoreId);
  await prisma.projectFile.delete({ where: { id: fileId } });

  return NextResponse.json({ success: true, message: 'File deleted' });
}
