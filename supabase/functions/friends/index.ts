import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

serve(serveWithOptions(async (req) => {
  const supabase = createSupabaseClient(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { pathname } = new URL(req.url)
  const pathParts = pathname.split('/')
  const friendId = pathParts[pathParts.length - 1]

  try {
    // --- Get all friends ---
    if (req.method === 'GET') {
      // Fetch all accepted friendships for the current user
      const { data: friendships, error: friendsError } = await supabase
          .from('friends')
          .select('user_id1, user_id2')
          .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`)
          .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      // Extract the IDs of the friends
      const friendIds = friendships.map(f => f.user_id1 === user.id ? f.user_id2 : f.user_id1);

      if (friendIds.length === 0) {
          return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Fetch the profile information for all friends
      const { data: friendsData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', friendIds);
      
      if (usersError) throw usersError;

      return new Response(JSON.stringify(friendsData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Send a friend request ---
    if (req.method === 'POST') {
      const { receiver_id } = await req.json()
      if (!receiver_id) throw new Error('receiver_id is required')

      // Ensure user_id1 is always the lower UUID to prevent duplicate requests
      const [user_id1, user_id2] = [user.id, receiver_id].sort()

      const { data, error } = await supabase
        .from('friends')
        .insert({ user_id1, user_id2, status: 'pending' })
        .select()
        .single()
      
      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- Accept a friend request ---
    if (req.method === 'PATCH') {
      if (!friendId) throw new Error('Friend ID is required in the path')

      // The user accepting the request is user_id2
      const { data, error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('user_id1', friendId) // The sender
        .eq('user_id2', user.id)   // The receiver (current user)
        .select()
        .single()
      
      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- Deny a request or remove a friend ---
    if (req.method === 'DELETE') {
      if (!friendId) throw new Error('Friend ID is required in the path')

      const [user_id1, user_id2] = [user.id, friendId].sort()
      
      const { data, error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id1', user_id1)
        .eq('user_id2', user_id2)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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