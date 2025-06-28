import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

serve(serveWithOptions(async (req) => {
  const supabase = createSupabaseClient(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')


  try {
    // --- Get messages for a conversation ---
    if (req.method === 'GET') {
      const { pathname } = new URL(req.url)
      const pathParts = pathname.split('/')
      const receiverId = pathParts[pathParts.length - 1]
      if (!receiverId) {
        return new Response(JSON.stringify({ error: 'receiver_id path parameter is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const filter = `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      
      const { data, error } = await supabase.from('messages')
        .select('*, file:files ( storage_path )')
        .or(filter)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const messagesWithUrls = data.map((message: any) => {
        const file = message.file as { storage_path: string } | null;
        if (file && file.storage_path) {
          const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(file.storage_path);
          return { ...message, file_url: publicUrl, file: undefined };
        }
        return { ...message, file_url: null };
      });

      return new Response(JSON.stringify(messagesWithUrls), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Create a new message ---
    if (req.method === 'POST') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      const body = await req.json()
      
      const insertData = {
        ...body,
        sender_id: user.id
      }

      const { data, error } = await supabase.from('messages').insert(insertData).select().single()

      if (error) throw error;

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
    return new Response(JSON.stringify({ error: err.message ?? 'An unknown error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})) 