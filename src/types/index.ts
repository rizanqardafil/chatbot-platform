export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  model: string;
  vectorStoreId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    conversations: number;
    files: number;
  };
}

export interface Conversation {
  id: string;
  title: string | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  conversationId: string;
  createdAt: Date;
}

export interface ProjectFile {
  id: string;
  name: string;
  openaiFileId: string;
  mimeType: string | null;
  size: number;
  projectId: string;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ChatEventType = 'delta' | 'done' | 'error';

export interface ChatEvent {
  type: ChatEventType;
  delta?: string;
  error?: string;
}
