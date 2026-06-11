'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/projects');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-retro-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-avatar-gradient mb-5">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="text-retro-gradient">Build agents</span>{' '}
            <span className="text-retro-text">that</span>
            <br />
            <span className="text-retro-gradient">speak your mind</span>
          </h1>
          <p className="text-retro-dim mt-3 text-sm">
            Sign in and your AI agents will be waiting for you
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-retro-danger/40 text-retro-danger px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <Input
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />

              <Button type="submit" className="w-full" loading={loading}>
                Sign in
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-retro-dim">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-retro-accent font-medium hover:underline">
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-retro-dim mt-8 tracking-wider">
          copyright © 2026 · chatbot platform
        </p>
      </div>
    </div>
  );
}
