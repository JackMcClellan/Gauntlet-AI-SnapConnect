import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

interface CaptionRequest {
  file_id: string;
  context?: string;
  style?: 'casual' | 'professional' | 'funny' | 'inspirational';
  max_length?: number;
}

interface CaptionResponse {
  caption: string;
  confidence: number;
  suggestions?: string[];
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

    const body: CaptionRequest = await req.json()
    const { file_id, context, style = 'casual', max_length = 100 } = body

    // Only support context-only caption generation
    if (!context) {
      return new Response(JSON.stringify({ error: 'context is required for caption generation' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build prompt for context-only AI generation
    const prompt = buildContextOnlyPrompt({
      context,
      style,
      maxLength: max_length
    })

    // Call OpenAI API
    const openaiResponse = await generateCaption(prompt)

    if (!openaiResponse.success) {
      return new Response(JSON.stringify({ error: 'Failed to generate caption' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response: CaptionResponse = {
      caption: openaiResponse.caption,
      confidence: openaiResponse.confidence,
      suggestions: openaiResponse.suggestions
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error in ai-caption function:', err)
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}))

function buildContextOnlyPrompt({
  context,
  style,
  maxLength
}: {
  context: string;
  style: string;
  maxLength: number;
}) {
  const styleContext = getStyleContext(style)
  
  let prompt = `You are a creative social media caption writer. Your task is to create engaging ${style} captions based on the user's description of their photo.

User's Description: "${context}"

Style Guidelines: ${styleContext}
Max length: ${maxLength} characters

IMPORTANT: Create completely fresh, creative captions that capture the essence of what they're sharing while being much more engaging and ${style} than their original description.

Requirements:
1. Generate 1 primary caption and 2 alternative suggestions
2. Keep all captions under ${maxLength} characters
3. Match the ${style} tone perfectly
4. Be creative and original - don't just rewrite their description
5. Make it social media ready and engaging
6. Use their description as inspiration for the theme/topic

Format your response as JSON:
{
  "caption": "main caption here",
  "suggestions": ["alternative 1", "alternative 2"],
  "confidence": 0.85
}`

  return prompt
}

function getStyleContext(style: string): string {
  const styles = {
    casual: 'Friendly, relaxed, conversational tone. Use everyday language and relatable expressions.',
    professional: 'Polished, informative, and sophisticated. Suitable for business or formal contexts.',
    funny: 'Humorous, witty, playful. Include puns, jokes, or clever observations where appropriate.',
    inspirational: 'Motivational, uplifting, positive. Focus on encouragement and meaningful messages.'
  }
  return styles[style as keyof typeof styles] || styles.casual
}

async function generateCaption(prompt: string) {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

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
            content: 'You are a creative social media caption writer. Generate engaging, authentic captions that match the user\'s style and interests. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    // Parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(content)
    } catch (parseError) {
      // Fallback: extract caption from plain text
      parsedResponse = {
        caption: content.substring(0, 100),
        suggestions: [],
        confidence: 0.7
      }
    }

    return {
      success: true,
      caption: parsedResponse.caption || content.substring(0, 100),
      suggestions: parsedResponse.suggestions || [],
      confidence: parsedResponse.confidence || 0.8
    }

  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 