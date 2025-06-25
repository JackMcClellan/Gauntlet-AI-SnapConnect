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

    // --- Logic for different HTTP methods ---
    let responseData: any;

    if (req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('stories')
        .select('*, user:users(*), file:files(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      responseData = data;
    } else if (req.method === 'POST') {
      const { file_type, storage_path, caption, tags, time_delay } = await req.json();
      const { data: fileData, error: fileError } = await supabaseClient.from('files').insert({
        file_type, storage_path, caption, tags
      }).select('id').single();
      if (fileError) throw fileError;
      
      const { data: storyData, error: storyError } = await supabaseClient.from('stories').insert({
        file_id: fileData.id, time_delay, caption
      }).select().single();
      if (storyError) throw storyError;
      responseData = storyData;
    } else if (req.method === 'DELETE') {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        if (!id) throw new Error('Story ID is required for deletion.');
        
        const { error } = await supabaseClient.from('stories').delete().eq('id', id).eq('user_id', user.id);
        
        if (error) throw error;
        responseData = { message: 'Story deleted successfully.' };
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