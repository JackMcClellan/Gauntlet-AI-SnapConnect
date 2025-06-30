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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Get stories from friends OR user's own stories
      // First get friend IDs
      const { data: friendships, error: friendsError } = await supabase
        .from('friends')
        .select('user_id1, user_id2')
        .eq('status', 'accepted')
        .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);
      
      if (friendsError) throw friendsError;
      
      const friendIds = friendships.flatMap((f: { user_id1: string; user_id2: string }) => [f.user_id1, f.user_id2]);
      const allowedUserIds = [...new Set([...friendIds, user.id])]; // Include user's own ID
      
      // Get stories that are not expired (e.g., created in the last 24 hours)
      // Show stories from friends OR user's own stories
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const result = await supabase.from('stories')
        .select(`
          *,
          user:users(id, username, avatar:file_id(storage_path)),
          file:files(*)
        `)
        .gt('created_at', yesterday)
        .in('user_id', allowedUserIds)
        .order('created_at', { ascending: false });
      
      data = result.data;
      error = result.error;

      // Process stories to add avatar URLs
      const storiesWithAvatarUrls = data.map((story: any) => {
        let user_with_avatar = story.user;
        if (user_with_avatar && user_with_avatar.avatar && user_with_avatar.avatar.storage_path) {
          const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(user_with_avatar.avatar.storage_path);
          user_with_avatar = { ...user_with_avatar, avatar_url: publicUrl, avatar: undefined };
        } else if (user_with_avatar) {
          user_with_avatar = { ...user_with_avatar, avatar_url: null };
        }
        
        return { ...story, user: user_with_avatar };
      });

      data = storiesWithAvatarUrls;

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
    console.error('Stories function error:', err)
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})) 