-----------------------------------------
-- TABLES
-----------------------------------------

-- USERS TABLE
-- This table stores public profile information for each user.
-- The 'id' column is a foreign key to the 'id' in 'auth.users', creating a one-to-one link.
create table public.users (
  id uuid not null primary key references auth.users(id) on delete cascade,
  username text,
  interests text[],
  file_id uuid references public.files(id) on delete set null,
  created_at timestamp with time zone default now() not null
);

-- Enable Row-Level Security
alter table public.users enable row level security;

-- Policies for USERS table
create policy "Users can view all public profiles." on public.users for select using (true);
create policy "Users can update their own profile." on public.users for update using (auth.uid() = id);

-- FILES TABLE
-- Stores references to files in Supabase Storage.
create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade default auth.uid(),
  file_type text not null, -- 'image' or 'video'
  storage_path text not null,
  caption text,
  tags text[],
  created_at timestamp with time zone default now() not null
);

-- Enable Row-Level Security
alter table public.files enable row level security;

-- Policies for FILES table
create policy "Users can view all public files." on public.files for select using (true);
create policy "Users can insert their own files." on public.files for insert with check (auth.uid() = user_id);
create policy "Users can delete their own files." on public.files for delete using (auth.uid() = user_id);


-- MESSAGES TABLE
-- Stores direct messages between users.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade default auth.uid(),
  receiver_id uuid not null references public.users(id) on delete cascade,
  content_type text not null, -- 'text' or 'file'
  content text,
  file_id uuid references public.files(id) on delete set null,
  created_at timestamp with time zone default now() not null
);

-- Enable Row-Level Security
alter table public.messages enable row level security;

-- Policies for MESSAGES table
create policy "Users can view messages they sent or received." on public.messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages." on public.messages for insert with check (auth.uid() = sender_id);

-- STORIES TABLE
-- Stores ephemeral stories from users.
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade default auth.uid(),
  file_id uuid not null references public.files(id) on delete cascade,
  time_delay float not null,
  caption text,
  created_at timestamp with time zone default now() not null
);

-- Enable Row-Level Security
alter table public.stories enable row level security;

-- Policies for STORIES table
create policy "Users can view all stories." on public.stories for select using (true);
create policy "Users can insert their own stories." on public.stories for insert with check (auth.uid() = user_id);
create policy "Users can delete their own stories." on public.stories for delete using (auth.uid() = user_id);

-- FRIENDS TABLE
-- Stores friendship relationships between users.
create table public.friends (
  user_id1 uuid not null references public.users(id) on delete cascade,
  user_id2 uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamp with time zone default now() not null,
  primary key (user_id1, user_id2),
  constraint check_different_users check (user_id1 <> user_id2)
);

-- Enable Row-Level Security
alter table public.friends enable row level security;

-- Policies for FRIENDS table
create policy "Users can see their own friendships." on public.friends for select using (auth.uid() = user_id1 or auth.uid() = user_id2);
create policy "Users can create friendships." on public.friends for insert with check (auth.uid() = user_id1);
create policy "Users can update their friendship status." on public.friends for update using (auth.uid() = user_id2); -- e.g., to accept a request
create policy "Users can remove their own friendships." on public.friends for delete using (auth.uid() = user_id1 or auth.uid() = user_id2);