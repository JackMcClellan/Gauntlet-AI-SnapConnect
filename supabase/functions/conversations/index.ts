import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'

serve(serveWithOptions(async (req) => {
  const supabase = createSupabaseClient(req)

  try {
    let data: any = null
    let error: any = null

    if (req.method === 'GET') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      ({ data, error } = await supabase.rpc('get_user_conversations', { p_user_id: user.id }))
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

    // Process conversations to add avatar URLs
    const conversationsWithAvatarUrls = data.map((conversation: any) => {
      let other_user_avatar_url = null;
      if (conversation.other_user_avatar_storage_path) {
        const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(conversation.other_user_avatar_storage_path);
        other_user_avatar_url = publicUrl;
      }
      
      return {
        ...conversation,
        other_user_avatar_url,
        other_user_avatar_storage_path: undefined
      };
    });

    return new Response(JSON.stringify(conversationsWithAvatarUrls), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})) 