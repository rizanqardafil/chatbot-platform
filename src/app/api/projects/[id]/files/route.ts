import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  uploadFileToOpenAI,
  ensureVectorStore,
  addFileToVectorStore,
} from '@/lib/openai';

type Params = Promise<{ id: string }>;

const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'text/csv',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== user.userId) {
    return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
  }

  const files = await prisma.projectFile.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: { files } });
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== user.userId) {
    return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: 'File size exceeds 20 MB limit' },
      { status: 400 }
    );
  }

  const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.csv', '.json', '.docx'];
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  // Some OSes send no MIME type for .md/.csv — fall back to extension check
  if (!ALLOWED_MIME_TYPES.includes(file.type) && !hasAllowedExtension) {
    return NextResponse.json(
      { success: false, error: 'Unsupported file type. Allowed: PDF, TXT, MD, CSV, JSON, DOCX' },
      { status: 400 }
    );
  }

  // Upload to OpenAI Files API
  const buffer = Buffer.from(await file.arrayBuffer());
  const { fileId } = await uploadFileToOpenAI(buffer, file.name, file.type);

  // Ensure project has a vector store and add file to it
  let vectorStoreId = project.vectorStoreId;
  try {
    vectorStoreId = await ensureVectorStore(projectId, project.vectorStoreId);
    await addFileToVectorStore(vectorStoreId, fileId);

    if (vectorStoreId !== project.vectorStoreId) {
      await prisma.project.update({
        where: { id: projectId },
        data: { vectorStoreId },
      });
    }
  } catch (err) {
    console.error('[Files] Vector store setup failed (file search may be unavailable):', err);
  }

  const projectFile = await prisma.projectFile.create({
    data: {
      name: file.name,
      openaiFileId: fileId,
      mimeType: file.type,
      size: file.size,
      projectId,
    },
  });

  return NextResponse.json({ success: true, data: { file: projectFile } }, { status: 201 });
}
