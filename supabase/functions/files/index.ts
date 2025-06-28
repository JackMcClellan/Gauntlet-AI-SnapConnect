import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'
import { createFileWithUpload, deleteFileAndStorage } from '../_shared/file-storage.ts'

serve(serveWithOptions(async (req) => {
  const supabase = createSupabaseClient(req)
  const { pathname } = new URL(req.url)
  const pathParts = pathname.split('/')
  const id = pathParts[pathParts.length - 1]

  try {
    if (req.method === 'GET') {
      let data, error;
      if (id && id !== 'files') {
        ({ data, error } = await supabase.from('files').select('*').eq('id', id).single())
      } else {
        ({ data, error } = await supabase.from('files').select('*'))
      }

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const formData = await req.formData()
      const file = formData.get('file') as File
      const caption = formData.get('caption') as string | null
      const tagsRaw = formData.get('tags') as string | null
      const tags = tagsRaw ? tagsRaw.split(',') : null
      
      const data = await createFileWithUpload(supabase, user, file, caption, tags)

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'DELETE') {
       const data = await deleteFileAndStorage(supabase, id)

       return new Response(JSON.stringify(data), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       })
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})) 