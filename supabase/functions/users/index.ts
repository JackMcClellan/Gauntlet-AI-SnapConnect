import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient } from '../_shared/supabase-client.ts'

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createSupabaseClient(req)
    
    if (req.method === 'GET') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];

      // Check if the last part of the path is 'users', meaning no ID was provided.
      if (id === 'users') {
        // List discoverable users
        const { data: friendships, error: friendsError } = await supabase
          .from('friends')
          .select('user_id1, user_id2')
          .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);
        
        if (friendsError) throw friendsError;
        
        const friendIds = friendships.flatMap((f: { user_id1: string; user_id2: string }) => [f.user_id1, f.user_id2]);
        const excludedIds = [...new Set([...friendIds, user.id])];

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .not('id', 'in', `(${excludedIds.join(',')})`);
        
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // If an ID is present in the path
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (req.method === 'PATCH') {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      const updateData = await req.json();
      const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();

      if (error) throw error;

      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 