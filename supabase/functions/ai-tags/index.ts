import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

interface TagRequest {
  context: string;
  file_type?: 'image' | 'video';
  max_tags?: number;
}

interface TagResponse {
  tags: string[];
  confidence: number;
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

    const body: TagRequest = await req.json()
    const { context, file_type = 'image', max_tags = 5 } = body

    if (!context || !context.trim()) {
      return new Response(JSON.stringify({ error: 'context is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user profile and interests for better tag generation
    const { data: userProfile } = await supabase
      .from('users')
      .select('interests')
      .eq('id', user.id)
      .single()

    // Get existing tags from user's files for consistency
    const { data: existingFiles } = await supabase
      .from('files')
      .select('tags')
      .eq('user_id', user.id)
      .not('tags', 'is', null)
      .limit(20)

    const userInterests = userProfile?.interests || []
    const existingTags = existingFiles?.flatMap(f => f.tags || []) || []
    const uniqueExistingTags = [...new Set(existingTags)]

    // Build prompt for AI tag generation
    const prompt = buildTagPrompt({
      context,
      fileType: file_type,
      userInterests,
      existingTags: uniqueExistingTags,
      maxTags: max_tags
    })

    // Call OpenAI API
    const openaiResponse = await generateTags(prompt)

    if (!openaiResponse.success) {
      // Fallback to simple tag generation
      const fallbackTags = generateFallbackTags(context, max_tags)
      return new Response(JSON.stringify({ 
        tags: fallbackTags,
        confidence: 0.5 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response: TagResponse = {
      tags: openaiResponse.tags,
      confidence: openaiResponse.confidence
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error in ai-tags function:', err)
    
    // Fallback to simple tag generation on error
    try {
      const body: TagRequest = await req.json()
      const fallbackTags = generateFallbackTags(body.context || '', body.max_tags || 5)
      return new Response(JSON.stringify({ 
        tags: fallbackTags,
        confidence: 0.3 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch {
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }
}))

function buildTagPrompt({
  context,
  fileType,
  userInterests,
  existingTags,
  maxTags
}: {
  context: string;
  fileType: string;
  userInterests: string[];
  existingTags: string[];
  maxTags: number;
}) {
  const interestsStr = userInterests.length > 0 ? userInterests.join(', ') : 'general'
  const existingTagsStr = existingTags.length > 0 ? existingTags.slice(0, 10).join(', ') : 'none'
  
  let prompt = `Generate relevant tags for a ${fileType} based on this context: "${context}"

User Profile:
- Interests: ${interestsStr}
- Previously used tags: ${existingTagsStr}

Requirements:
1. Generate ${maxTags} relevant, specific tags
2. Tags should be 1-2 words each, lowercase
3. Focus on: activities, locations, objects, moods, themes
4. Consider user's interests: ${interestsStr}
5. Be consistent with previously used tags when relevant
6. Avoid generic tags like "photo" or "image"

Examples of good tags:
- For "having coffee with friends": coffee, friends, social, cafe, morning, conversation
- For "sunset at the beach": sunset, beach, golden-hour, ocean, peaceful, nature
- For "working out at gym": fitness, gym, workout, exercise, health, strength

Format your response as JSON:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "confidence": 0.9
}`

  return prompt
}

async function generateTags(prompt: string) {
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
            content: 'You are an expert at generating relevant, specific tags for social media content. Generate concise, searchable tags that help categorize and discover content. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
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
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Invalid JSON response from OpenAI')
    }

    return {
      success: true,
      tags: parsedResponse.tags || [],
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

function generateFallbackTags(context: string, maxTags: number): string[] {
  const words = context.toLowerCase().split(/\s+/)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'am', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those'])
  
  // Activity-based tag mapping
  const activityMap: Record<string, string[]> = {
    'coffee': ['coffee', 'cafe', 'morning', 'social'],
    'workout': ['fitness', 'gym', 'exercise', 'health'],
    'beach': ['beach', 'ocean', 'summer', 'vacation'],
    'sunset': ['sunset', 'golden-hour', 'peaceful', 'nature'],
    'friends': ['friends', 'social', 'gathering', 'fun'],
    'food': ['food', 'dining', 'delicious', 'meal'],
    'travel': ['travel', 'adventure', 'explore', 'journey'],
    'work': ['work', 'office', 'professional', 'busy'],
    'family': ['family', 'love', 'together', 'bonding'],
    'music': ['music', 'concert', 'performance', 'entertainment'],
    'nature': ['nature', 'outdoors', 'peaceful', 'fresh-air'],
    'party': ['party', 'celebration', 'fun', 'social'],
    'shopping': ['shopping', 'retail', 'fashion', 'style'],
    'study': ['study', 'learning', 'education', 'focus']
  }
  
  let tags: string[] = []
  
  // Check for activity keywords
  for (const [keyword, relatedTags] of Object.entries(activityMap)) {
    if (context.toLowerCase().includes(keyword)) {
      tags.push(...relatedTags.slice(0, 2))
    }
  }
  
  // Add meaningful words from context
  const meaningfulWords = words
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, maxTags - tags.length)
  
  tags.push(...meaningfulWords)
  
  // Remove duplicates and limit to maxTags
  return [...new Set(tags)].slice(0, maxTags)
} 