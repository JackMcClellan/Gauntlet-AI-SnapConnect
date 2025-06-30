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
      
      // Check if this is a request for a specific post
      if (id && id !== 'posts') {
        // Get specific post by ID
        const result = await supabase.from('stories')
          .select(`
            *,
            user:users(id, username, avatar:file_id(storage_path)),
            file:files(*)
          `)
          .eq('id', id)
          .eq('is_public', true)
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Get all public stories that are not expired (e.g., created in the last 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const result = await supabase.from('stories')
          .select(`
            *,
            user:users(id, username, avatar:file_id(storage_path)),
            file:files(*)
          `)
          .eq('is_public', true)
          .gt('created_at', yesterday)
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
      }

      // Process stories to add avatar URLs
      if (data) {
        if (Array.isArray(data)) {
          // Multiple posts
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
        } else {
          // Single post
          let user_with_avatar = data.user;
          if (user_with_avatar && user_with_avatar.avatar && user_with_avatar.avatar.storage_path) {
            const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(user_with_avatar.avatar.storage_path);
            user_with_avatar = { ...user_with_avatar, avatar_url: publicUrl, avatar: undefined };
          } else if (user_with_avatar) {
            user_with_avatar = { ...user_with_avatar, avatar_url: null };
          }
          data = { ...data, user: user_with_avatar };
        }
      }

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
    console.error('Posts function error:', err)
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})) 