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
    // --- Get all friends and pending requests ---
    if (req.method === 'GET') {
      const { data: friendships, error } = await supabase
        .from('friends')
        .select(`
          status,
          created_at,
          user_id1:users!friends_user_id1_fkey(*),
          user_id2:users!friends_user_id2_fkey(*)
        `)
        .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

      if (error) throw error;
      
      type Friendship = {
        status: 'pending' | 'accepted',
        created_at: string,
        user_id1: { id: string },
        user_id2: { id: string },
      }

      // We need to shape the data to hide the implementation detail of user_id1 vs user_id2
      const shapedData = friendships.map((f: Friendship) => {
        // If the current user is user_id2, it means it's a PENDING request for them
        // In this case, the other user is user_id1
        if (f.user_id2.id === user.id) {
          return {
            status: f.status,
            created_at: f.created_at,
            user_id1: f.user_id1,
            user_id2: f.user_id2,
          }
        }
        // Otherwise, it's either an accepted friendship or a pending request they sent
        // The other user is user_id2
        return {
          status: f.status,
          created_at: f.created_at,
          // For consistency on the client, we swap them
          user_id1: f.user_id2,
          user_id2: f.user_id1,
        }
      })

      return new Response(JSON.stringify(shapedData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Send a friend request ---
    if (req.method === 'POST') {
      const { receiver_id } = await req.json()
      if (!receiver_id) throw new Error('receiver_id is required')

      // The sender is user_id1, the receiver is user_id2
      const { data, error } = await supabase
        .from('friends')
        .insert({ user_id1: user.id, user_id2: receiver_id, status: 'pending' })
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
        .select(`
          status,
          created_at,
          user_id1:users!friends_user_id1_fkey(*),
          user_id2:users!friends_user_id2_fkey(*)
        `)
        .single()
      
      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- Deny a request or remove a friend ---
    if (req.method === 'DELETE') {
      if (!friendId) throw new Error('Friend ID is required in the path')
      
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`(user_id1.eq.${user.id},and(user_id2.eq.${friendId})), (user_id1.eq.${friendId},and(user_id2.eq.${user.id}))`)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ message: 'Friendship removed.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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