import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { file_type, storage_path, caption, tags, time_delay } = await req.json()

    // First, insert into the files table
    const { data: fileData, error: fileError } = await supabaseClient
      .from('files')
      .insert({
        file_type,
        storage_path,
        caption,
        tags,
      })
      .select('id')
      .single()

    if (fileError) throw fileError

    const file_id = fileData.id

    // Then, insert into the stories table
    const { data: storyData, error: storyError } = await supabaseClient
      .from('stories')
      .insert({
        file_id,
        time_delay,
        caption,
      })
      .select()
      .single()

    if (storyError) throw storyError

    return new Response(JSON.stringify({ story: storyData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 