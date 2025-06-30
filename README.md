# Gauntlet-AI-SnapConnect
A Snapchat clone with AI-powered features for enhanced content creation and discovery

## 🚀 Getting Started

### Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Expo Go** app on your mobile device (for testing on physical devices)

### Installation

1. **Install dependencies**
   ```bash
   npm install 
   # or
   npm install --legacy-peer-deps
   ```

2. **Set up environment variables**
   - Create a `.env` file in the root directory
   - Add your Supabase configuration:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Configure AI Services**
   - Add OpenAI API key to your Supabase Edge Functions environment
   - Ensure proper RLS policies are set up for AI-generated content

### Running the Project

#### Development Server

Start the Expo development server:
```bash
npx expo start
```

#### Testing on Physical Devices

1. **Install Expo Go** on your mobile device
2. **Scan the QR code** displayed in the terminal or browser
3. **Allow camera and microphone permissions** when prompted

## 🤖 AI Features

### Overview
SnapConnect integrates multiple AI capabilities to enhance user experience, from content creation to discovery. All AI features are powered by OpenAI's GPT and embedding models.

### 1. AI Caption Generation
**Location**: `supabase/functions/ai-caption/index.ts`

Automatically generates engaging captions for user content based on context and visual analysis.

**Features**:
- Context-aware caption generation
- Multiple caption style options (casual, professional, creative)
- Integration with content upload flow

**Implementation**:
```typescript
// Frontend hook
hooks/use-ai-caption.ts - React hook for AI caption functionality
components/AiCaptionGenerator.tsx - UI component for caption generation
components/SendModal.tsx - Integration with content sharing flow
```

**Usage Flow**:
1. User captures/selects content
2. Provides context description
3. AI generates caption options
4. User selects preferred caption or uses as-is

### 2. AI Content Tagging
**Location**: `supabase/functions/ai-tags/index.ts`

Automatically generates relevant tags for uploaded content to improve discoverability.

**Features**:
- Visual content analysis
- Context-based tag generation
- Consistent tag vocabulary
- Integration with search functionality

**Database Integration**:
- Tags stored in `files.tags` array column
- Used for content categorization and search
- Enables semantic content discovery

### 3. AI-Powered Search & Discovery
**Location**: `supabase/functions/rag-search/index.ts`

Advanced search capabilities using AI embeddings and semantic understanding.

**Features**:
- **Semantic Search**: Uses OpenAI embeddings for meaning-based search
- **Tag-Based Search**: Direct tag matching for precise results
- **Hybrid Search**: Combines semantic and tag-based approaches
- **RAG (Retrieval-Augmented Generation)**: AI responses based on user content

**Implementation**:
```typescript
// Search functionality
hooks/use-rag-search.ts - React hook for search operations
app/(tabs)/discover.tsx - Search UI and local filtering
components/RAGSearchExample.tsx - Demo component for search features
```

**Search Types**:
- `semantic`: Uses AI embeddings for contextual matching
- `tags`: Direct tag-based filtering
- `hybrid`: Combines both approaches for comprehensive results

### 4. Vector Embeddings System
**Location**: `supabase/functions/generate-embedding/index.ts`

Generates and stores vector embeddings for content to enable semantic search.

**Database Schema**:
```sql
-- Vector embeddings table
CREATE TABLE content_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES stories(id),
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at timestamp DEFAULT now()
);
```

**Features**:
- Automatic embedding generation on content upload
- Efficient similarity search using pgvector
- Batch processing for large content sets

### AI Architecture

#### Backend (Supabase Edge Functions)
```
supabase/functions/
├── ai-caption/         # Caption generation service
├── ai-tags/           # Content tagging service  
├── generate-embedding/ # Vector embedding generation
├── rag-search/        # Semantic search and RAG
└── _shared/           # Common utilities and CORS handling
```

#### Frontend Integration
```
├── hooks/
│   ├── use-ai-caption.ts    # AI caption generation hook
│   └── use-rag-search.ts    # Search and discovery hook
├── components/
│   ├── AiCaptionGenerator.tsx # Caption UI component
│   └── RAGSearchExample.tsx   # Search demo component
```

#### Database Schema
```sql
-- AI-enhanced content storage
ALTER TABLE files ADD COLUMN tags text[] DEFAULT '{}';
ALTER TABLE files ADD COLUMN ai_generated_caption text;

-- Vector search functions
CREATE FUNCTION search_similar_content(query_embedding vector, user_id uuid, match_threshold float, match_count int);
CREATE FUNCTION search_content_by_tags(search_tags text[], user_id uuid, match_count int);
```

### AI Configuration

#### Required Environment Variables (Supabase)
```bash
OPENAI_API_KEY=your_openai_api_key
```

#### Models Used
- **Text Generation**: `gpt-4o-mini` for captions and responses
- **Embeddings**: `text-embedding-3-small` for semantic search
- **Context Window**: Optimized for mobile content and user context

### AI Performance Considerations

- **Caching**: Embeddings cached to avoid regeneration
- **Batch Processing**: Multiple operations grouped for efficiency  
- **Fallback Handling**: Graceful degradation when AI services unavailable
- **Rate Limiting**: Built-in throttling for API calls
- **Local Filtering**: Client-side search for immediate results

### Project Structure

```
Gauntlet-AI-SnapConnect/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication routes
│   ├── (tabs)/            # Main tab navigation
│   ├── chat/              # Chat functionality
│   └── discover/          # AI-powered content discovery
├── components/            # Reusable UI components
│   ├── AiCaptionGenerator.tsx # AI caption interface
│   └── RAGSearchExample.tsx   # Search demo
├── hooks/                 # Custom React hooks
│   ├── use-ai-caption.ts  # AI caption functionality
│   └── use-rag-search.ts  # AI search capabilities
├── lib/                   # API and Supabase configuration
├── supabase/              # Backend AI services
│   ├── functions/         # Edge functions for AI processing
│   └── migrations/        # Database schema with AI features
└── types/                 # TypeScript definitions including AI types
```

### Key Features

- 📱 **Cross-platform**: iOS, Android, and Web support
- 🔐 **Authentication**: Supabase-powered auth system
- 📷 **Camera Integration**: Photo capture and sharing
- 💬 **Real-time Chat**: Instant messaging capabilities
- 🤖 **AI Caption Generation**: Smart, context-aware captions
- 🏷️ **AI Content Tagging**: Automatic content categorization
- 🔍 **AI-Powered Search**: Semantic and tag-based discovery
- 🧠 **Vector Embeddings**: Advanced content understanding
- 🎨 **Modern UI**: Responsive design with dark mode support

### Development Tools

- **TypeScript**: Full type safety
- **Expo Router**: File-based routing
- **React Native**: Cross-platform mobile development
- **Supabase**: Backend as a Service with AI integration
- **OpenAI**: AI services for content enhancement
- **pgvector**: Vector similarity search

### Troubleshooting

#### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start --clear`
2. **Permission errors**: Ensure camera and microphone permissions are granted
3. **Build failures**: Check Node.js version compatibility
4. **Supabase connection**: Verify environment variables are correctly set
5. **AI services**: Ensure OpenAI API key is configured in Supabase Edge Functions
6. **Vector search**: Verify pgvector extension is enabled in Supabase

#### Getting Help

- Check the [Expo documentation](https://docs.expo.dev/)
- Review [React Native documentation](https://reactnative.dev/)
- Consult [Supabase documentation](https://supabase.com/docs)
- See [OpenAI API documentation](https://platform.openai.com/docs)

### License

This project is licensed under the MIT License.
