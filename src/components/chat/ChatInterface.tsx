'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, StopCircle, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  conversationId: string;
  projectName: string;
  initialMessages: Message[];
  onTitleUpdate?: (title: string) => void;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

export function ChatInterface({
  conversationId,
  projectName,
  initialMessages,
  onTitleUpdate,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m, i) => (i === prev.length - 1 && m.streaming ? { ...m, streaming: false } : m))
    );
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setInput('');
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Optimistically add user message
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);

    // Add streaming placeholder for assistant
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let buffer = '';

    try {
      const res = await fetch(`/api/conversations/${conversationId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get response');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const raw = part.slice(6).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw);

            if (event.type === 'delta') {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = {
                    ...last,
                    content: last.content + event.delta,
                    streaming: true,
                  };
                }
                return next;
              });
            }

            if (event.type === 'done') {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, streaming: false };
                }
                return next;
              });
            }

            if (event.type === 'error') {
              setError(event.error || 'An error occurred');
              setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
            }
          } catch {
            // JSON parse error — skip
          }
        }
      }

      // Signal title refresh if first message
      onTitleUpdate?.(trimmed);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message || 'Failed to send message');
        setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-retro-bg">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-24">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-avatar-gradient">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-retro-gradient">
                  Ask {projectName} anything
                </p>
                <p className="text-sm text-retro-dim mt-2">
                  Talk freely and the AI will answer based on its prompt &amp; knowledge
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) =>
            msg.role === 'user' ? (
              /* User message — pill bar with lightning avatar, HeyAI style */
              <div key={i} className="flex gap-3 items-start animate-fade-in">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-retro-surface2 border border-retro-border flex items-center justify-center">
                  <Zap className="h-4 w-4 text-retro-muted" />
                </div>
                <div className="flex-1 rounded-2xl bg-retro-surface border border-retro-border px-4 py-2.5 text-sm text-retro-text">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              /* Assistant message — gradient sparkle avatar + plain text */
              <div key={i} className="flex gap-3 items-start animate-fade-in">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-avatar-gradient flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 pt-2 text-sm leading-relaxed text-retro-text">
                  <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-pre:my-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.streaming && (
                      <span className="inline-block w-2 h-4 bg-retro-accent opacity-80 animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {error && (
            <div className="text-center">
              <p className="inline-block rounded-full border border-retro-danger/40 text-retro-danger px-4 py-2 text-xs">
                {error}
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input — pill bar with sparkle, HeyAI style */}
      <div className="border-t border-retro-border/50 bg-retro-bg p-4">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <div className="flex-1 flex items-end gap-2 rounded-3xl bg-retro-surface border border-retro-border px-4 py-2 focus-within:ring-2 focus-within:ring-retro-purple transition-shadow">
            <Sparkles className="h-4 w-4 text-retro-purple flex-shrink-0 mb-2.5" />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="I'm looking for..."
              rows={1}
              className={cn(
                'flex-1 resize-none bg-transparent py-1.5 text-sm text-retro-text',
                'focus:outline-none placeholder:text-retro-dim max-h-40'
              )}
              disabled={isStreaming}
            />
          </div>

          {isStreaming ? (
            <Button variant="danger" size="icon" onClick={stopStreaming} title="Stop generating">
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim()}
              title="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
        <p className="text-center text-[10px] text-retro-dim mt-2 tracking-wider">
          powered by openai responses api
        </p>
      </div>
    </div>
  );
}
