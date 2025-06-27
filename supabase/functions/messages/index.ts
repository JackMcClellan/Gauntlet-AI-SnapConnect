import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

serve(serveWithOptions(async (req) => {
  const supabase = createSupabaseClient(req)
  const { searchParams } = new URL(req.url)

  try {
    let data: any = null
    let error: any = null

    if (req.method === 'GET') {
      const receiverId = searchParams.get('receiver_id')
      if (!receiverId) {
        return new Response(JSON.stringify({ error: 'receiver_id query parameter is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      ({ data, error } = await supabase.from('messages')
        .select('*')
        .or(`(sender_id.eq.${user.id},and(receiver_id.eq.${receiverId})), (sender_id.eq.${receiverId},and(receiver_id.eq.${user.id}))`)
        .order('created_at'))

    } else if (req.method === 'POST') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const body = await req.json()
      
      const insertData = {
        ...body,
        sender_id: user.id
      }

      ({ data, error } = await supabase.from('messages').insert(insertData).select().single())
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