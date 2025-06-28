import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

serve(serveWithOptions(async (req) => {
  const supabase = createSupabaseClient(req)
  const { pathname } = new URL(req.url)
  const pathParts = pathname.split('/')
  const id = pathParts[pathParts.length - 1]

  try {
    let data: any = null
    let error: any = null

    if (req.method === 'GET') {
      // Get stories that are not expired (e.g., created in the last 24 hours)
      // The schema doesn't have an expires_at, so we'll filter by created_at.
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      ({ data, error } = await supabase.from('stories')
        .select(`
          *,
          user:users(username, avatar_url),
          file:files(*)
        `)
        .gt('created_at', yesterday)
        .order('created_at', { ascending: false }))

    } else if (req.method === 'POST') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const body = await req.json()
      
      const insertData = {
        ...body,
        user_id: user.id
      }
      
      ({ data, error } = await supabase.from('stories').insert(insertData).select().single())
    } else if (req.method === 'DELETE') {
       ({ data, error } = await supabase.from('stories').delete().eq('id', id).select().single())
    } else {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (error) {
      console.error(error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})) 