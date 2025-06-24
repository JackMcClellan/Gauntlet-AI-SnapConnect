# 🛠️ SnapFix - Technical Architecture & Implementation Details

---

## 🧱 Frontend Stack

| Component        | Technology                   |
|------------------|------------------------------|
| Mobile Framework | React Native with Expo       |
| State Management | Jotai Atom                   |
| Navigation       | Expo Router                  |
| AR Features      | Expo Camera + ARKit/WebAR    |

---

## 🔙 Backend Stack (Supabase)

| Component    | Technology                           |
|-------------|--------------------------------------|
| Auth        | Supabase Auth                        |
| Database    | Supabase PostgreSQL + Vector Ext     |
| Storage     | Supabase Storage                     |
| Realtime    | Supabase Realtime                    |
| Functions   | Supabase Edge Functions (RAG orchestration) |

---

## 🤖 AI & RAG Stack

| Component         | Technology / Service                    |
|------------------|------------------------------------------|
| LLM              | OpenAI GPT-4 API                         |
| Embeddings       | OpenAI (text-embedding-ada-002)          |
| Vector Database  | Supabase Vector or Pinecone              |
| Retrieval Sources| DIY YouTube videos, PDFs, product guides |
| Function Orchestration | Supabase Edge Functions             |

---

## 🔁 Example RAG Flow (Fix Suggestion)

1. **User Input**: Photo/video of broken item with short caption or auto-tag
2. **Embedding**: Create embedding of caption + image tag(s)
3. **Query**: Perform semantic search in vector DB (project videos, forums, manuals)
4. **Retrieval**: Return top N relevant repair posts/documents
5. **Generation**: Prompt GPT-4 with retrieval + context to generate fix idea or step-by-step
6. **Output**: Display as caption, DM suggestion, or post idea

---

## 🗃️ Database Models (Simplified)

### `users`
```ts
id: uuid
email: string
handle: string
avatar_url: string
interests: string[]
level: "newbie" | "intermediate" | "pro"
```

### `stories`
```ts
id: uuid
user_id: uuid
media_url: string
caption: string
tags: string[]
created_at: timestamp
expires_at: timestamp
```

### `messages`
```ts
id: uuid
from_user_id: uuid
to_user_id: uuid
content_type: "text" | "image" | "video"
content: text or url
timestamp: timestamp
```

### `content_embeddings`
```ts
id: uuid
user_id: uuid
content_type: "story" | "query"
embedding: vector
metadata: jsonb
created_at: timestamp
```

---

## 🧪 Edge Function Examples

- `/generate-caption`: Creates a caption for a user's post based on retrieved content + prompt
- `/fix-suggestions`: Uses visual tags and captions to return suggested how-tos
- `/content-ideas`: Generates daily post ideas based on interests + trends

---

## 🚀 Deployment Plan

- Use [EAS](https://docs.expo.dev/eas/) for building and deploying the app to iOS/Android
- Use Vercel or Netlify for any supporting dashboards
- Ensure edge functions are regionally distributed for low latency
- Embed telemetry to monitor response times and RAG usage quality

---
