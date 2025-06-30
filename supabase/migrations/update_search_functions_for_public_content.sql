-- Update search functions to include public stories and all public content
-- This migration updates the existing RPC functions to search across public content

-- Drop and recreate the search_similar_content function to include public stories
DROP FUNCTION IF EXISTS search_similar_content(vector(1536), uuid, float, int);

CREATE OR REPLACE FUNCTION search_similar_content(
  query_embedding vector(1536),
  user_id_param uuid,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_context text,
  caption text,
  tags text[],
  file_type text,
  storage_path text,
  similarity float,
  created_at timestamp with time zone,
  user_id uuid,
  username text,
  avatar_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    files.id,
    files.user_context,
    files.caption,
    files.tags,
    files.file_type,
    files.storage_path,
    1 - (files.embedding <=> query_embedding) as similarity,
    files.created_at,
    files.user_id,
    users.username,
    users.file_id as avatar_url
  FROM public.files
  JOIN public.users ON files.user_id = users.id
  LEFT JOIN public.stories ON stories.file_id = files.id
  WHERE files.embedding IS NOT NULL
    AND 1 - (files.embedding <=> query_embedding) > match_threshold
    AND (
      -- Include all public stories  
      (stories.is_public = true)
      OR
      -- Include all files with tags or user_context (publicly searchable content)
      (files.tags IS NOT NULL AND array_length(files.tags, 1) > 0)
      OR
      (files.user_context IS NOT NULL AND files.user_context != '')
      OR
      -- Include user's own content
      (files.user_id = user_id_param)
    )
  ORDER BY files.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Drop and recreate the search_content_by_tags function to include public stories
DROP FUNCTION IF EXISTS search_content_by_tags(text[], uuid, int);

CREATE OR REPLACE FUNCTION search_content_by_tags(
  search_tags text[],
  user_id_param uuid,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_context text,
  caption text,
  tags text[],
  file_type text,
  storage_path text,
  created_at timestamp with time zone,
  user_id uuid,
  username text,
  avatar_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    files.id,
    files.user_context,
    files.caption,
    files.tags,
    files.file_type,
    files.storage_path,
    files.created_at,
    files.user_id,
    users.username,
    users.file_id as avatar_url
  FROM public.files
  JOIN public.users ON files.user_id = users.id
  LEFT JOIN public.stories ON stories.file_id = files.id
  WHERE files.tags && search_tags  -- Array overlap operator
    AND (
      -- Include all public stories
      (stories.is_public = true)
      OR
      -- Include all files with tags or user_context (publicly searchable content)
      (files.tags IS NOT NULL AND array_length(files.tags, 1) > 0)
      OR
      (files.user_context IS NOT NULL AND files.user_context != '')
      OR
      -- Include user's own content
      (files.user_id = user_id_param)
    )
  ORDER BY files.created_at DESC
  LIMIT match_count;
END;
$$; 