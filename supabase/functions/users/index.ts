import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

serve(serveWithOptions(async (req) => {
  const supabase = createSupabaseClient(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ message: 'User not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const { pathname } = new URL(req.url)
  const pathParts = pathname.split('/')
  const lastPart = pathParts[pathParts.length - 1]

  const userWithAvatarUrl = (user: any) => {
    if (user.avatar && user.avatar.storage_path) {
      const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(user.avatar.storage_path);
      return { ...user, avatar_url: publicUrl, avatar: undefined };
    }
    return { ...user, avatar_url: null };
  };

  try {
    // --- Handle GET requests ---
    if (req.method === 'GET') {
      // Endpoint to get the current user's profile
      if (lastPart === 'me') {
        const { data, error } = await supabase
          .from('users')
          .select('*, avatar:file_id ( storage_path )')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        const userWithAvatar = userWithAvatarUrl(data);
        return new Response(JSON.stringify(userWithAvatar), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (lastPart === 'users') {
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
          .select('*, avatar:file_id ( storage_path )')
          .not('id', 'in', `(${excludedIds.join(',')})`);
        
        if (error) throw error;

        const usersWithAvatars = data.map(userWithAvatarUrl);

        return new Response(JSON.stringify(usersWithAvatars), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Endpoint to get a user by ID
      const userId = lastPart;
      if (userId) {
        const { data, error } = await supabase
          .from('users')
          .select('*, avatar:file_id ( storage_path )')
          .eq('id', userId)
          .single();

        if (error) throw error;
        const userWithAvatar = userWithAvatarUrl(data);
        return new Response(JSON.stringify(userWithAvatar), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
        
      return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Handle PATCH requests ---
    if (req.method === 'PATCH') {
      const userId = lastPart;
      if (userId !== user.id) {
        return new Response(JSON.stringify({ message: 'You can only update your own profile.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const body = await req.json();
      const { data, error } = await supabase
        .from('users')
        .update(body)
        .eq('id', user.id)
        .select('*, avatar:file_id ( storage_path )')
        .single();
      
      if (error) throw error;
      const userWithAvatar = userWithAvatarUrl(data);
      return new Response(JSON.stringify(userWithAvatar), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: (err as Error).message ?? 'An unknown server error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})) 