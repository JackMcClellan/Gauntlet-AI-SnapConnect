-- Enable the pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to files table for RAG functionality
ALTER TABLE public.files ADD COLUMN embedding vector(1536);

-- Create an index on the embedding column for fast similarity search
CREATE INDEX ON public.files USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create a function to search similar content using vector similarity
CREATE OR REPLACE FUNCTION search_similar_content(
  query_embedding vector(1536),
  user_id_param uuid,
  match_threshold float DEFAULT 0.7,
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
      -- Include user's own content
      (files.user_id = user_id_param)
    )
  ORDER BY files.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a function to get content by tags (for hybrid search)
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
      -- Include user's own content
      (files.user_id = user_id_param)
    )
  ORDER BY files.created_at DESC
  LIMIT match_count;
END;
$$; 