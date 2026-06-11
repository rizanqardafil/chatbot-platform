import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { user } });
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.headers.set(
    'Set-Cookie',
    'token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
  return response;
}
