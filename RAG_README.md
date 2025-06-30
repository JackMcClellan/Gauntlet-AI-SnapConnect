# RAG (Retrieval-Augmented Generation) System with Supabase

This implementation provides a complete RAG system for SnapConnect that allows users to semantically search through their content and get AI-generated responses based on their personal data.

## 🚀 Features

- **Semantic Search**: Vector-based similarity search using OpenAI embeddings
- **Tag-based Search**: Traditional keyword/tag-based content discovery
- **Hybrid Search**: Combines semantic and tag-based approaches for best results
- **AI Response Generation**: GPT-4o-mini generates contextual responses based on retrieved content
- **Automatic Processing**: Tags and embeddings are generated automatically when users upload content
- **Privacy-first**: Each user can only search their own content

## 🏗️ Architecture

### Database Layer
- **pgvector Extension**: Enables vector storage and similarity search
- **Embedding Column**: Stores 1536-dimensional vectors from OpenAI's text-embedding-3-small
- **Vector Index**: IVFFlat index for fast similarity search
- **Custom Functions**: PostgreSQL functions for semantic and tag-based search

### Edge Functions
1. **`ai-tags`**: Generates relevant tags from user context
2. **`generate-embedding`**: Creates vector embeddings from text
3. **`rag-search`**: Performs semantic search and generates AI responses
4. **`send-snap`**: Enhanced to automatically generate tags and embeddings

### Frontend Hooks
- **`useRAGSearch`**: Main hook for RAG functionality
- **`useSemanticSearch`**: Specialized for semantic-only search
- **`useTagSearch`**: Specialized for tag-only search

## 🔧 Setup

### 1. Database Migration
Run the vector embeddings migration:
```sql
-- This enables pgvector and adds the embedding column
-- Run: supabase db push
```

### 2. Environment Variables
Add to your Supabase project:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Deploy Edge Functions
```bash
# Deploy all new edge functions
supabase functions deploy ai-tags
supabase functions deploy generate-embedding
supabase functions deploy rag-search
```

## 📚 Usage Examples

### Basic RAG Search
```typescript
import { useRAGSearch } from '@/hooks/use-rag-search';

function MyComponent() {
  const { searchContent, results, generatedResponse, isLoading } = useRAGSearch();

  const handleSearch = async () => {
    await searchContent("Show me my coffee photos", {
      search_type: 'hybrid',
      max_results: 10,
      generate_response: true
    });
  };

  return (
    <div>
      {generatedResponse && <p>{generatedResponse}</p>}
      {results.map(result => (
        <div key={result.id}>
          <p>{result.user_context}</p>
          <p>Tags: {result.tags?.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}
```

### Semantic Search Only
```typescript
import { useSemanticSearch } from '@/hooks/use-rag-search';

function SemanticSearchComponent() {
  const { semanticSearch, results, isLoading } = useSemanticSearch();

  const handleSearch = () => {
    semanticSearch("workout sessions", 5);
  };

  return (
    <div>
      {results.map(result => (
        <div key={result.id}>
          <p>{result.user_context}</p>
          <p>Similarity: {(result.similarity * 100).toFixed(0)}%</p>
        </div>
      ))}
    </div>
  );
}
```

### Direct API Usage
```typescript
import { ragSearch } from '@/lib/api';

const searchResults = await ragSearch({
  query: "Find my travel photos",
  search_type: 'hybrid',
  max_results: 20,
  generate_response: true
});

console.log(searchResults.generated_response);
console.log(searchResults.results);
```

## 🎯 Search Types

### 1. Semantic Search (`'semantic'`)
- Uses vector embeddings to find semantically similar content
- Best for: Conceptual queries, finding related themes
- Example: "relaxing moments" → finds beaches, sunsets, coffee breaks

### 2. Tag Search (`'tags'`)
- Matches specific keywords/tags
- Best for: Precise filtering, known categories
- Example: "coffee" → finds all content tagged with "coffee"

### 3. Hybrid Search (`'hybrid'`)
- Combines semantic and tag-based approaches
- Best for: General queries, balanced results
- Example: "workout sessions" → finds both gym photos and fitness-related content

## 📋 Query Examples

### Lifestyle Queries
```typescript
// Find social activities
await searchContent("social gatherings with friends");

// Find fitness content
await searchContent("workout and exercise sessions");

// Find food-related content
await searchContent("meals and dining experiences");
```

### Time-based Queries
```typescript
// Recent activities
await searchContent("what have I been doing lately");

// Seasonal content
await searchContent("summer activities and beach days");
```

### Mood-based Queries
```typescript
// Relaxing content
await searchContent("peaceful and relaxing moments");

// Energetic content
await searchContent("active and energetic activities");
```

## 🔍 Response Types

### RAGSearchResponse
```typescript
interface RAGSearchResponse {
  results: ContentResult[];           // Matching content
  generated_response?: string;        // AI-generated response
  query_embedding?: number[];         // Query vector (for debugging)
  search_type: string;               // Type of search performed
}
```

### ContentResult
```typescript
interface ContentResult {
  id: string;                        // File ID
  user_context: string;              // What user said they were doing
  caption: string;                   // File caption
  tags: string[];                    // AI-generated tags
  file_type: string;                 // 'image' or 'video'
  similarity?: number;               // Similarity score (0-1)
  created_at: string;                // When content was created
}
```

## 🎨 UI Components

### RAGSearchExample Component
A complete example component is provided that demonstrates:
- Search type selection (Smart/Semantic/Tags)
- Query input with examples
- Results display with tags and similarity scores
- AI response presentation
- Error handling

```typescript
import { RAGSearchExample } from '@/components/RAGSearchExample';

function MyScreen() {
  return (
    <RAGSearchExample 
      placeholder="Ask about your content..."
      maxResults={10}
    />
  );
}
```

## ⚡ Performance Considerations

### Vector Index Optimization
- Index is created with `lists = 100` for optimal performance
- Adjust based on your data size:
  - Small datasets (<10K): `lists = 50`
  - Large datasets (>100K): `lists = 1000`

### Embedding Costs
- OpenAI text-embedding-3-small: ~$0.02 per 1M tokens
- Average user context: ~10-50 tokens
- Cost per embedding: ~$0.0000005-0.000025

### Search Performance
- Semantic search: ~50-200ms (depends on data size)
- Tag search: ~10-50ms
- Hybrid search: ~100-300ms
- AI response generation: ~1-3 seconds

## 🔒 Security & Privacy

### Row Level Security
All functions respect Supabase RLS policies:
- Users can only search their own content
- Embeddings are tied to user accounts
- No cross-user data leakage

### Data Protection
- Embeddings are stored securely in Supabase
- OpenAI API calls are made server-side only
- No user data is stored by OpenAI (per their API terms)

## 🛠️ Troubleshooting

### Common Issues

1. **"No results found"**
   - Check if content has embeddings generated
   - Lower the similarity threshold
   - Try different search types

2. **"Embedding generation failed"**
   - Verify OpenAI API key is set
   - Check API quota/billing
   - Ensure text is not empty

3. **"Slow search performance"**
   - Check vector index status
   - Consider adjusting index parameters
   - Monitor database performance

### Debug Queries
```sql
-- Check embedding coverage
SELECT 
  COUNT(*) as total_files,
  COUNT(embedding) as files_with_embeddings
FROM files WHERE user_id = 'your-user-id';

-- Check vector index
SELECT * FROM pg_indexes WHERE tablename = 'files';
```

## 🚀 Future Enhancements

### Planned Features
- **Multi-modal Search**: Image + text embeddings
- **Temporal Search**: Time-based queries ("last month's activities")
- **Collaborative Search**: Search shared content with friends
- **Advanced Filters**: Location, date range, file type filters
- **Search Analytics**: Track popular queries and patterns

### Integration Ideas
- **Voice Search**: Speech-to-text → RAG search
- **Smart Recommendations**: "You might also like..."
- **Content Insights**: "Your most active themes this month"
- **Social Features**: "Friends who share similar interests"

## 📊 Monitoring & Analytics

### Key Metrics to Track
- Search success rate (results returned)
- User engagement (clicks on results)
- AI response quality (user feedback)
- Embedding coverage (% of content with embeddings)
- Search performance (latency)

### Monitoring Queries
```sql
-- Most common search terms (implement logging)
-- Search performance metrics
-- Embedding generation success rate
```

---

The RAG system provides a powerful foundation for content discovery and AI-powered insights. Users can now ask natural language questions about their content and get intelligent, contextual responses based on their personal data. 