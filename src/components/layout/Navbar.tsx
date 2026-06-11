'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  userEmail?: string;
}

export function Navbar({ userEmail }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 h-14 bg-retro-bg/90 backdrop-blur-sm border-b border-retro-border/50">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <Link href="/projects" className="flex items-center gap-2 font-semibold text-retro-text lowercase tracking-tight">
          <Bot className="h-5 w-5 text-retro-purple" />
          <span>chatbot.platform</span>
        </Link>

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-retro-dim">
              <User className="h-3.5 w-3.5" />
              {userEmail}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
