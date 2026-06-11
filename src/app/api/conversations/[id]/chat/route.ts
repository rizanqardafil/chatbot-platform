import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';
import { generateConversationTitle } from '@/lib/utils';

type Params = Promise<{ id: string }>;

const MAX_HISTORY_MESSAGES = 50;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
  }

  // Fetch conversation with project and history
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      project: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        take: MAX_HISTORY_MESSAGES,
      },
    },
  });

  if (!conversation || conversation.project.userId !== user.userId) {
    return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
  }

  // Persist user message immediately
  await prisma.message.create({
    data: {
      role: 'user',
      content: message.trim(),
      conversationId,
    },
  });

  // Update conversation title on first message
  const isFirstMessage = conversation.messages.length === 0;
  if (isFirstMessage) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: generateConversationTitle(message) },
    });
  }

  // Build input history for Responses API
  const inputHistory = conversation.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  inputHistory.push({ role: 'user', content: message.trim() });

  // Build tools for file search if vector store exists
  const hasVectorStore = Boolean(conversation.project.vectorStoreId);

  const encoder = new TextEncoder();
  let fullContent = '';

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const responseParams = {
          model: conversation.project.model,
          instructions: conversation.project.systemPrompt || 'You are a helpful assistant.',
          input: inputHistory,
          stream: true as const,
          ...(hasVectorStore && {
            tools: [
              {
                type: 'file_search' as const,
                vector_store_ids: [conversation.project.vectorStoreId!],
              },
            ],
          }),
        };

        const response = await openai.responses.create(responseParams);

        for await (const event of response) {
          if (event.type === 'response.output_text.delta') {
            fullContent += event.delta;
            enqueue({ type: 'delta', delta: event.delta });
          }
        }

        // Persist assistant message
        await prisma.message.create({
          data: {
            role: 'assistant',
            content: fullContent,
            conversationId,
          },
        });

        // Touch conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        enqueue({ type: 'done' });
      } catch (err) {
        console.error('[POST /api/conversations/[id]/chat]', err);
        enqueue({ type: 'error', error: 'Failed to generate response. Please try again.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
