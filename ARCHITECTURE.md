# Architecture & Design

## Overview

ChatBot Platform is a full-stack Next.js application that enables users to create and interact with custom AI agents. It uses a monolithic architecture (single Next.js app) with clearly separated concerns — server-side API routes, client-side React components, and a PostgreSQL database via Prisma.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Auth Pages  │  │  Dashboard   │  │  Chat UI     │  │
│  │ (login/reg)  │  │ (projects)   │  │  (SSE stream)│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼─────────────────┼─────────────────┼──────────┘
          │ HTTPS            │ HTTPS            │ SSE
┌─────────▼─────────────────▼─────────────────▼──────────┐
│              Next.js App (Vercel Edge/Node)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Middleware (JWT validation)           │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  │
│  │ Auth API   │  │ Projects   │  │ Chat API (stream)  │  │
│  │ /register  │  │ /projects  │  │ /conversations/:id │  │
│  │ /login     │  │ /files     │  │     /chat          │  │
│  └──────┬─────┘  └──────┬─────┘  └─────────┬─────────┘  │
└─────────┼───────────────┼──────────────────┼────────────┘
          │               │                  │
┌─────────▼───────────────▼──────────────────▼────────────┐
│                   Data Layer                              │
│  ┌──────────────────────┐  ┌────────────────────────┐   │
│  │  PostgreSQL (Prisma) │  │   OpenAI Platform       │   │
│  │  - users             │  │  - Responses API        │   │
│  │  - projects          │  │  - Files API            │   │
│  │  - conversations     │  │  - Vector Stores        │   │
│  │  - messages          │  └────────────────────────┘   │
│  │  - project_files     │                                │
│  └──────────────────────┘                                │
└──────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Monolithic Next.js App

**Decision:** Single Next.js app with both frontend (pages) and backend (API routes).

**Rationale:**
- Simplifies deployment (single Vercel project)
- Eliminates CORS complexity
- Type-sharing between client and server
- Easier to scale horizontally on Vercel's serverless infrastructure

**Trade-off:** For very high traffic, API routes can be extracted to a separate service without UI changes.

---

### 2. JWT in HTTP-only Cookies

**Decision:** Store JWT tokens in `HttpOnly; SameSite=Lax` cookies instead of localStorage.

**Rationale:**
- Protects against XSS attacks (JavaScript cannot read HttpOnly cookies)
- `SameSite=Lax` mitigates CSRF attacks for navigation requests
- Transparent to the client — no manual token management

**Security flow:**
```
POST /api/auth/login
  → verify credentials
  → sign JWT (7d expiry, HS256)
  → Set-Cookie: token=...; HttpOnly; Secure; SameSite=Lax
```

---

### 3. Streaming via Server-Sent Events (SSE)

**Decision:** Use native `ReadableStream` with SSE format for chat streaming instead of WebSockets or polling.

**Rationale:**
- SSE is unidirectional (server → client), which matches the chat use case
- Works natively in all modern browsers without libraries
- Compatible with Vercel's serverless environment
- Much simpler than WebSockets for this use case

**Streaming pipeline:**
```
Client                    Next.js API              OpenAI
  │                           │                       │
  │── POST /chat ────────────►│                       │
  │                           │── responses.create ──►│
  │                           │◄── stream events ─────│
  │◄── SSE: {type:delta} ────│  (response.output_text.delta)
  │◄── SSE: {type:delta} ────│
  │◄── SSE: {type:done} ─────│
```

---

### 4. OpenAI Responses API (not Chat Completions)

**Decision:** Use the newer OpenAI Responses API (`/v1/responses`) instead of Chat Completions.

**Rationale:**
- Native file search support via vector stores
- Built-in tool use (web search, code interpreter)
- Better conversation state management
- Future-proof — Anthropic and others are moving toward this pattern

**Usage:**
```typescript
await openai.responses.create({
  model: "gpt-4o-mini",
  instructions: project.systemPrompt,  // system prompt
  input: conversationHistory,           // chat history
  tools: [{ type: "file_search", vector_store_ids: [vectorStoreId] }],
  stream: true,
});
```

---

### 5. File Search via OpenAI Vector Stores

**Decision:** Use OpenAI's vector store infrastructure for file search (RAG) instead of building custom embeddings.

**Rationale:**
- Zero additional infrastructure (no embedding model, no vector DB)
- Files are processed and chunked automatically
- Search quality matches OpenAI's embedding models
- Cost-effective for MVP

**File upload flow:**
```
1. Upload file → OpenAI Files API (purpose: "assistants")
2. Create/retrieve vector store for project
3. Add file to vector store
4. Store openaiFileId + vectorStoreId in PostgreSQL
5. In chat: include { type: "file_search", vector_store_ids: [...] } in tools
```

---

## Database Schema

```
users
  id, email (unique), name, password (bcrypt), createdAt

projects
  id, name, description, systemPrompt, model
  vectorStoreId (OpenAI), userId → users
  timestamps

conversations
  id, title (auto-generated from first message)
  projectId → projects
  timestamps

messages
  id, role (user|assistant), content
  conversationId → conversations
  createdAt

project_files
  id, name, openaiFileId, mimeType, size
  projectId → projects
  createdAt
```

All foreign keys use `onDelete: Cascade` — deleting a project removes all its conversations, messages, and file records.

---

## Security Measures

| Concern | Mitigation |
|---|---|
| Auth | JWT with 7-day expiry, `HttpOnly` cookies |
| Passwords | bcrypt with cost factor 12 |
| Authorization | Every API route verifies ownership (userId check) |
| XSS | HTTP-only cookies, React's built-in escaping |
| CSRF | `SameSite=Lax` cookies |
| File uploads | MIME type validation, 20 MB size limit |
| SQL injection | Prisma ORM with parameterized queries |
| Secrets | Environment variables, never committed |

---

## Scalability

### Horizontal scaling
- Next.js on Vercel auto-scales per request
- Database connections use PgBouncer/Prisma connection pooling
- Stateless JWT auth — any instance can serve any request

### Multi-tenancy
- All queries are scoped by `userId`
- Row-level data isolation via Prisma `where` clauses
- Each project has its own OpenAI vector store

### Performance
- Streaming responses eliminate wait time (first token in ~500ms)
- Conversation history limited to last 50 messages to manage token costs
- Lean Prisma queries (select only needed fields)
- Next.js ISR/SSG not used for dynamic user data (correct for this use case)

---

## Extensibility

The architecture is designed to allow future additions:

| Feature | How to add |
|---|---|
| Analytics | Add `analytics` table, log token counts per message |
| Team workspaces | Add `Organization` model, scope projects by org |
| Custom model providers | Abstract LLM calls behind a provider interface |
| Rate limiting | Add Redis + sliding window counter middleware |
| Webhooks | Add `webhook` table, emit events via worker queue |
| API keys | Add `api_keys` table, support Bearer token auth |
| Mobile app | All functionality available via REST API |

---

## Error Handling

- API routes return `{ success: boolean, error?: string, data?: T }` consistently
- SSE chat stream emits `{ type: "error", error: "..." }` on LLM failure
- Client shows inline error messages, never crashes silently
- Streaming errors: partial messages are dropped, user can retry
- OpenAI errors: caught and returned as user-friendly messages
