import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

interface EmbeddingRequest {
  text: string;
  file_id?: string; // Optional: to update a specific file record
}

interface EmbeddingResponse {
  embedding: number[];
  success: boolean;
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

    const body: EmbeddingRequest = await req.json()
    const { text, file_id } = body

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate embedding using OpenAI
    const embeddingResult = await generateEmbedding(text)

    if (!embeddingResult.success) {
      return new Response(JSON.stringify({ error: 'Failed to generate embedding' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If file_id is provided, update the file record with the embedding
    if (file_id) {
      const { data: updateData, error: updateError } = await supabase
        .from('files')
        .update({ embedding: embeddingResult.embedding })
        .eq('id', file_id)
        .eq('user_id', user.id) // Ensure user owns the file
        .select()

      if (updateError) {
        console.error('Failed to update file with embedding:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to update file record' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      console.log('Successfully updated file with embedding:', file_id, 'Updated rows:', updateData?.length || 0)
    }

    const response: EmbeddingResponse = {
      embedding: embeddingResult.embedding,
      success: true
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error in generate-embedding function:', err)
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}))

async function generateEmbedding(text: string) {
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
        model: 'text-embedding-3-small', // 1536 dimensions, cost-effective
        input: text,
        encoding_format: 'float'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI Embedding API error:', errorText)
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
    console.error('Error calling OpenAI Embedding API:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 