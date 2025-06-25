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
      const { id } = await req.json().catch(() => ({ id: null }));
      if (id) {
        // Get specific user by ID
        const { data, error } = await supabaseClient.from('users').select('*').eq('id', id).single();
        if (error) throw error;
        responseData = data;
      } else {
        // Get all users except the current one
        const { data, error } = await supabaseClient.from('users').select('*').neq('id', user.id);
        if (error) throw error;
        responseData = data;
      }
    } else if (req.method === 'PATCH') {
      // Update the current user's profile
      const updates = await req.json();
      delete updates.id; // Prevent changing the ID
      const { data, error } = await supabaseClient
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
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