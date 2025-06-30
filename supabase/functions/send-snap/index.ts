import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createSupabaseClient, serveWithOptions } from '../_shared/supabase-client.ts'
import { createFileWithUpload } from '../_shared/file-storage.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2'

serve(serveWithOptions(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const userSupabase = createSupabaseClient(req);
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string | null;
    const userContext = formData.get('userContext') as string | null;
    const toStory = formData.get('toStory') === 'true';
    const toPublic = formData.get('toPublic') === 'true';
    const toFriendsRaw = formData.get('toFriends') as string | null;
    const toFriends = toFriendsRaw ? JSON.parse(toFriendsRaw) : [];

    if (!file) {
      return new Response(JSON.stringify({ error: 'File is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Upload file and create a file record (without tags first)
    const fileRecord = await createFileWithUpload(supabaseAdmin, user, file, caption, null, userContext);
    const fileId = fileRecord.id;

    // Step 1.1: Generate AI tags if userContext is provided
    let generatedTags: string[] = [];
    if (userContext && userContext.trim()) {
      try {
        const tagResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-tags`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('authorization') || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context: userContext,
            file_type: file.type.startsWith('image') ? 'image' : 'video',
            max_tags: 5
          })
        });

                 if (tagResponse.ok) {
           const tagData = await tagResponse.json();
           generatedTags = tagData.tags || [];
           
           // Update the file record with generated tags
           if (generatedTags.length > 0) {
             const { error: tagUpdateError } = await supabaseAdmin
               .from('files')
               .update({ tags: generatedTags })
               .eq('id', fileId);
               
             if (tagUpdateError) {
               console.error('Failed to update tags:', tagUpdateError);
             }
           }
         }

         // Step 1.2: Generate embedding for the user context
         try {
           const embeddingResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-embedding`, {
             method: 'POST',
             headers: {
               'Authorization': req.headers.get('authorization') || '',
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({
               text: userContext,
               file_id: fileId
             })
           });

           if (!embeddingResponse.ok) {
             const errorText = await embeddingResponse.text();
             console.error('Failed to generate embedding:', errorText);
           } else {
             const embeddingData = await embeddingResponse.json();
             console.log('Successfully generated embedding for file:', fileId);
           }
         } catch (embeddingError) {
           console.error('Failed to generate embedding:', embeddingError);
           // Continue without embedding - not a blocking error
         }
      } catch (tagError) {
        console.error('Failed to generate tags:', tagError);
        // Continue without tags - not a blocking error
      }
    }

    // Step 2: Create a story if requested
    if (toStory) {
      const { error: storyError } = await supabaseAdmin
        .from('stories')
        .insert({
          file_id: fileId,
          user_id: user.id,
          time_delay: 10,
          is_public: toPublic,
          caption: caption || null,
        });
      if (storyError) throw new Error(`Failed to create story: ${storyError.message}`);
    }

    // Step 3: Send messages to selected friends
    if (toFriends.length > 0) {
      const messages = toFriends.map((friendId: string) => ({
        sender_id: user.id,
        receiver_id: friendId,
        content_type: 'file',
        file_id: fileId,
      }));

      const { error: messageError } = await supabaseAdmin.from('messages').insert(messages);
      if (messageError) throw new Error(`Failed to send messages: ${messageError.message}`);
    }

    return new Response(JSON.stringify({ success: true, fileId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})); 