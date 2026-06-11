# ChatBot Platform

A full-stack chatbot platform that lets you create, manage, and chat with custom AI agents — each with their own system prompt, model selection, and file knowledge base.

**Live Demo:** [chatbot-platform.vercel.app](https://chatbot-platform.vercel.app) *(deploy your own instance)*

---

## Features

- **Authentication** — JWT-based auth with secure HTTP-only cookies
- **User accounts** — Register and login with email + password (bcrypt hashed)
- **Projects/Agents** — Create multiple agents, each with custom system prompts and AI model selection
- **Streaming chat** — Real-time streaming responses via OpenAI Responses API + Server-Sent Events
- **File knowledge base** — Upload documents (PDF, TXT, MD, CSV, JSON, DOCX) to enable file search
- **Conversation history** — Persistent message history per conversation
- **Multiple conversations** — Unlimited conversations per agent

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL via Prisma |
| Auth | JWT (`jose`) + bcryptjs |
| LLM | OpenAI Responses API (`gpt-4o-mini`, `gpt-4o`) |
| File Search | OpenAI Files API + Vector Stores |
| UI | TailwindCSS 3, custom components |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or [Supabase](https://supabase.com) / [Neon](https://neon.tech) for hosted)
- OpenAI API key ([platform.openai.com](https://platform.openai.com))

### 1. Clone and install

```bash
git clone <repo-url>
cd chatbot-platform
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/chatbot_platform"

# Generate: openssl rand -base64 32
JWT_SECRET="your-super-secret-key"

# Your OpenAI API key
OPENAI_API_KEY="sk-..."
```

### 3. Set up the database

```bash
npm run db:push      # Push schema to DB (creates tables)
npm run db:generate  # Generate Prisma client
```

### 4. Run development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel)

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/chatbot-platform)

### Manual deploy

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Random secret (use `openssl rand -base64 32`)
- `OPENAI_API_KEY` — Your OpenAI key

After deploying, run database migrations:

```bash
vercel env pull .env.local
npm run db:push
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login, sets `token` cookie |
| `GET` | `/api/auth/me` | Get current user |
| `DELETE` | `/api/auth/me` | Logout (clears cookie) |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List user's projects |
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects/:id` | Get project with files |
| `PUT` | `/api/projects/:id` | Update project settings |
| `DELETE` | `/api/projects/:id` | Delete project |

### Conversations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/:id/conversations` | List conversations |
| `POST` | `/api/projects/:id/conversations` | Create conversation |
| `GET` | `/api/conversations/:id` | Get conversation + messages |
| `DELETE` | `/api/conversations/:id` | Delete conversation |
| `POST` | `/api/conversations/:id/chat` | **Send message (SSE stream)** |

### Files

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/:id/files` | List project files |
| `POST` | `/api/projects/:id/files` | Upload file (multipart/form-data) |
| `DELETE` | `/api/files/:fileId` | Delete file |

### Chat SSE Format

The `/api/conversations/:id/chat` endpoint returns a text/event-stream:

```
data: {"type":"delta","delta":"Hello"}
data: {"type":"delta","delta":" world"}
data: {"type":"done"}
```

On error:
```
data: {"type":"error","error":"Failed to generate response"}
```

---

## Project Structure

```
chatbot-platform/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login & Register pages
│   │   ├── (dashboard)/     # Protected app pages
│   │   │   └── projects/    # Project pages + chat
│   │   └── api/             # API route handlers
│   ├── components/
│   │   ├── chat/            # ChatInterface, ConversationSidebar
│   │   ├── layout/          # Navbar
│   │   ├── projects/        # ProjectCard
│   │   └── ui/              # Button, Input, Card, etc.
│   ├── lib/
│   │   ├── auth.ts          # JWT utilities
│   │   ├── openai.ts        # OpenAI client + helpers
│   │   ├── prisma.ts        # Prisma singleton
│   │   └── utils.ts         # Shared utilities
│   ├── middleware.ts         # Route protection
│   └── types/index.ts       # Shared TypeScript types
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars) |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `NEXT_PUBLIC_APP_URL` | No | App URL (for CORS, defaults to localhost) |
