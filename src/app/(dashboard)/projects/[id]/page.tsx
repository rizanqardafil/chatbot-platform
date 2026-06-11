'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Trash2,
  Upload,
  FileText,
  X,
  Save,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatFileSize, formatDate } from '@/lib/utils';
import { SUPPORTED_MODELS } from '@/lib/models';
import type { Project, ProjectFile, Conversation } from '@/types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project & { files: ProjectFile[] } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/conversations`),
      ]);

      if (!pRes.ok) { router.push('/projects'); return; }

      const pData = await pRes.json();
      const cData = await cRes.json();

      setProject(pData.data.project);
      setName(pData.data.project.name);
      setDescription(pData.data.project.description || '');
      setSystemPrompt(pData.data.project.systemPrompt || '');
      setModel(pData.data.project.model);
      setConversations(cData.data?.conversations || []);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, systemPrompt, model }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); return; }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this agent and all its conversations? This cannot be undone.')) return;
    setDeleting(true);
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    router.push('/projects');
  };

  const handleNewChat = async () => {
    const res = await fetch(`/api/projects/${id}/conversations`, { method: 'POST' });
    const data = await res.json();
    router.push(`/projects/${id}/chat/${data.data.conversation.id}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/projects/${id}/files`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setProject((prev) => prev ? { ...prev, files: [data.data.file, ...prev.files] } : prev);
      } else {
        setError(data.error || 'Upload failed');
      }
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Remove this file from the agent?')) return;
    await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    setProject((prev) => prev ? { ...prev, files: prev.files.filter((f) => f.id !== fileId) } : prev);
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm('Delete this conversation?')) return;
    await fetch(`/api/conversations/${convId}`, { method: 'DELETE' });
    setConversations((prev) => prev.filter((c) => c.id !== convId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-retro-dim" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-retro-dim hover:text-retro-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All agents
        </Link>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button onClick={handleNewChat}>
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold">
        <span className="text-retro-gradient">{project.name}</span>
      </h1>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl border border-retro-danger/40 text-retro-danger px-4 py-3 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Agent name *" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-retro-muted uppercase tracking-wider">AI Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="block w-full rounded-xl border border-retro-border bg-retro-surface px-4 py-2.5 text-sm text-retro-text focus:outline-none focus:ring-2 focus:ring-retro-purple focus:border-transparent"
              >
                {SUPPORTED_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this agent do?"
          />

          <Textarea
            label="System prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            placeholder="Instructions for the agent…"
          />

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} variant={saveSuccess ? 'secondary' : 'primary'}>
              {saveSuccess ? '✓ Saved' : <><Save className="h-4 w-4" /> Save changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Knowledge Files</CardTitle>
            <div>
              <Button
                variant="outline"
                size="sm"
                loading={uploadingFile}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {uploadingFile ? 'Uploading…' : 'Upload file'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.txt,.md,.csv,.json,.docx"
                disabled={uploadingFile}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {project.files.length === 0 ? (
            <p className="text-sm text-retro-dim text-center py-6">
              No files uploaded yet. Upload documents to enable file search in chat.
            </p>
          ) : (
            <ul className="divide-y divide-retro-border/50">
              {project.files.map((file) => (
                <li key={file.id} className="flex items-center gap-3 py-3">
                  <FileText className="h-4 w-4 text-retro-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-retro-text truncate">{file.name}</p>
                    <p className="text-xs text-retro-dim">{formatFileSize(file.size)} · {formatDate(file.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-retro-dim hover:text-retro-danger transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {project.files.length > 0 && (
            <p className="text-xs text-retro-dim mt-3 flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
              File search is enabled for this agent
            </p>
          )}
        </CardContent>
      </Card>

      {/* Conversations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Conversations</CardTitle>
            <Badge variant="default">{conversations.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-sm text-retro-dim text-center py-6">
              No conversations yet. Start a new chat to begin.
            </p>
          ) : (
            <ul className="divide-y divide-retro-border/50">
              {conversations.map((conv) => (
                <li key={conv.id} className="flex items-center gap-3 py-3">
                  <MessageSquare className="h-4 w-4 text-retro-dim flex-shrink-0" />
                  <Link
                    href={`/projects/${id}/chat/${conv.id}`}
                    className="flex-1 min-w-0 group"
                  >
                    <p className="text-sm font-medium text-retro-text truncate group-hover:text-retro-accent transition-colors">
                      {conv.title || 'New conversation'}
                    </p>
                    <p className="text-xs text-retro-dim">{formatDate(conv.updatedAt)}</p>
                  </Link>
                  <button
                    onClick={() => handleDeleteConversation(conv.id)}
                    className="text-retro-dim hover:text-retro-danger transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
