'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SUPPORTED_MODELS } from '@/lib/models';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.');
  const [model, setModel] = useState('gpt-4o-mini');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Agent name is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, systemPrompt, model }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create agent');
        return;
      }

      router.push(`/projects/${data.data.project.id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-retro-dim hover:text-retro-text transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to agents
      </Link>

      <h1 className="text-2xl font-bold mb-6">
        <span className="text-retro-gradient">Create new agent</span>
      </h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-retro-danger/40 text-retro-danger px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <Input
              id="name"
              label="Agent name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer Support Bot"
              required
            />

            <Input
              id="description"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this agent does"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="model" className="text-xs font-medium text-retro-muted uppercase tracking-wider">
                AI Model
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="block w-full rounded-xl border border-retro-border bg-retro-surface px-4 py-2.5 text-sm text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-purple focus:border-transparent"
              >
                {SUPPORTED_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <Textarea
              id="systemPrompt"
              label="System prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Instructions for how the agent should behave…"
              rows={6}
            />

            <div className="flex gap-3 pt-2">
              <Link href="/projects" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" loading={loading}>
                Create Agent
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
