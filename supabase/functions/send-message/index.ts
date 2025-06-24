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

    const { receiver_id, content_type, content, file } = await req.json()
    let file_id = null

    if (content_type === 'file' && file) {
      const { data: fileData, error: fileError } = await supabaseClient
        .from('files')
        .insert({
          file_type: file.file_type,
          storage_path: file.storage_path,
          caption: file.caption,
          tags: file.tags,
        })
        .select('id')
        .single()
      
      if (fileError) throw fileError
      file_id = fileData.id
    }

    const { data: messageData, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        receiver_id,
        content_type,
        content: content_type === 'text' ? content : null,
        file_id,
      })
      .select()
      .single()

    if (messageError) throw messageError

    return new Response(JSON.stringify({ message: messageData }), {
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