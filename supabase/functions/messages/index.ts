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
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not found.')

    let responseData: any;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const other_user_id = url.searchParams.get('other_user_id');
      if (!other_user_id) {
        throw new Error('other_user_id is required to get messages.');
      }
      // Get message history with a specific user
      const { data, error } = await supabaseClient
        .from('messages')
        .select('*, senderProfile:users!sender_id(*)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      responseData = data;
    } else if (req.method === 'POST') {
      // Create a new message
      const { receiver_id, content_type, content, file } = await req.json();
      let file_id = null;
      if (content_type === 'file' && file) {
        // Logic to create file record...
        const { data: fileData, error: fileError } = await supabaseClient.from('files').insert(file).select('id').single();
        if (fileError) throw fileError;
        file_id = fileData.id;
      }
      const { data, error } = await supabaseClient.from('messages').insert({
        receiver_id,
        content_type,
        content: content_type === 'text' ? content : null,
        file_id,
      }).select().single();
      if (error) throw error;
      responseData = data;
    } else {
      throw new Error(`Method ${req.method} not supported.`);
    }

    return new Response(JSON.stringify(responseData), {
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