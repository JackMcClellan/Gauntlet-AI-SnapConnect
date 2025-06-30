import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

interface RAGSearchRequest {
  query: string;
  search_type?: 'semantic' | 'tags' | 'hybrid';
  max_results?: number;
  generate_response?: boolean;
}

interface ContentResult {
  id: string;
  user_context: string;
  caption: string;
  tags: string[];
  file_type: string;
  similarity?: number;
  created_at: string;
}

interface RAGSearchResponse {
  results: ContentResult[];
  generated_response?: string;
  query_embedding?: number[];
  search_type: string;
}

serve(serveWithOptions(async (req) => {
  const supabase = createSupabaseClient(req)

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: RAGSearchRequest = await req.json()
    const { 
      query, 
      search_type = 'hybrid', 
      max_results = 10, 
      generate_response = true 
    } = body

    if (!query || !query.trim()) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let results: ContentResult[] = []
    let queryEmbedding: number[] | undefined

    // Perform search based on type
    if (search_type === 'semantic' || search_type === 'hybrid') {
      // Generate embedding for the query
      const embeddingResult = await generateQueryEmbedding(query)
      if (embeddingResult.success) {
        queryEmbedding = embeddingResult.embedding
        
        // Perform semantic search
        const { data: semanticResults, error: semanticError } = await supabase
          .rpc('search_similar_content', {
            query_embedding: queryEmbedding,
            user_id_param: user.id,
            match_threshold: 0.7,
            match_count: search_type === 'hybrid' ? Math.ceil(max_results / 2) : max_results
          })

        if (!semanticError && semanticResults) {
          results.push(...semanticResults)
        }
      }
    }

    if (search_type === 'tags' || search_type === 'hybrid') {
      // Extract potential tags from query
      const searchTags = extractTagsFromQuery(query)
      
      if (searchTags.length > 0) {
        const { data: tagResults, error: tagError } = await supabase
          .rpc('search_content_by_tags', {
            search_tags: searchTags,
            user_id_param: user.id,
            match_count: search_type === 'hybrid' ? Math.ceil(max_results / 2) : max_results
          })

        if (!tagError && tagResults) {
          // Add tag results, avoiding duplicates
          const existingIds = new Set(results.map(r => r.id))
          const newTagResults = tagResults.filter(r => !existingIds.has(r.id))
          results.push(...newTagResults)
        }
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.id, item])).values()
    ).slice(0, max_results)

    let generatedResponse: string | undefined

    // Generate AI response if requested and we have results
    if (generate_response && uniqueResults.length > 0) {
      const responseResult = await generateRAGResponse(query, uniqueResults)
      if (responseResult.success) {
        generatedResponse = responseResult.response
      }
    }

    const response: RAGSearchResponse = {
      results: uniqueResults,
      generated_response: generatedResponse,
      query_embedding: queryEmbedding,
      search_type
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error in rag-search function:', err)
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}))

async function generateQueryEmbedding(query: string) {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float'
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const embedding = data.data?.[0]?.embedding

    if (!embedding) {
      throw new Error('No embedding returned from OpenAI')
    }

    return {
      success: true,
      embedding: embedding
    }

  } catch (error) {
    console.error('Error generating query embedding:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

function extractTagsFromQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/)
  
  // Common activity/theme keywords that might be in user queries
  const activityKeywords = [
    'coffee', 'food', 'dinner', 'lunch', 'breakfast', 'meal',
    'workout', 'gym', 'exercise', 'fitness', 'run', 'sport',
    'beach', 'ocean', 'sea', 'water', 'swim', 'vacation',
    'sunset', 'sunrise', 'morning', 'evening', 'night',
    'friends', 'family', 'social', 'party', 'gathering',
    'work', 'office', 'meeting', 'business', 'professional',
    'travel', 'trip', 'adventure', 'explore', 'journey',
    'music', 'concert', 'performance', 'art', 'creative',
    'nature', 'outdoor', 'hiking', 'park', 'garden',
    'shopping', 'fashion', 'style', 'clothes', 'retail',
    'study', 'learning', 'education', 'book', 'school'
  ]
  
  return words.filter(word => activityKeywords.includes(word))
}

async function generateRAGResponse(query: string, results: ContentResult[]) {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build context from search results
    const context = results.map((result, index) => {
      const contextText = result.user_context || result.caption || 'No description'
      const tags = result.tags?.join(', ') || 'No tags'
      return `${index + 1}. ${contextText} (Tags: ${tags})`
    }).join('\n')

    const prompt = `Based on the user's content below, answer their question: "${query}"

User's Content:
${context}

Instructions:
- Answer based only on the provided content
- Be conversational and helpful
- If you can identify patterns or themes, mention them
- If the content doesn't contain relevant information, say so
- Keep the response concise but informative
- Reference specific activities or moments when relevant

Response:`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions about a user\'s personal content and activities. Be conversational and insightful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedResponse = data.choices[0]?.message?.content

    if (!generatedResponse) {
      throw new Error('No response generated')
    }

    return {
      success: true,
      response: generatedResponse
    }

  } catch (error) {
    console.error('Error generating RAG response:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 