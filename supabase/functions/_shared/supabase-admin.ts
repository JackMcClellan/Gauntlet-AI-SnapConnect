import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Note: we need to use the SERVICE_ROLE_KEY to bypass RLS and call the RPC function
// that aggregates conversation data. The RPC function has its own security measures.
export function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
} 