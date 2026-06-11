import { getServerUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userPayload = await getServerUser();
  if (!userPayload) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
    select: { email: true },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userEmail={user?.email} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
