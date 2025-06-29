import { User as SupabaseUser } from "@supabase/supabase-js";

export interface AppUser {
  id: string;
  username: string | null;
  interests: string[] | null;
  created_at: string;
  avatar_url?: string | null;
}

export interface File {
  id: string;
  user_id: string;
  file_type: 'image' | 'video';
  storage_path: string;
  caption: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content_type: 'text' | 'file';
  content: string | null;
  file_id: string | null;
  created_at: string;
  file_url?: string | null;
}

export interface Story {
  id: string;
  user_id: string;
  file_id: string;
  time_delay: number;
  caption: string | null;
  created_at: string;
  user: Pick<AppUser, 'username' | 'avatar_url'>;
  file: File;
}

export interface Conversation {
  other_user_id: string;
  other_user_username: string;
  other_user_avatar_url: string;
  last_message_id: string;
  last_message_content_type: string;
  last_message_content: string;
  last_message_created_at: string;
}

// API Payloads
export interface UpdateUserPayload {
  username?: string;
  file_id?: string;
  interests?: string[];
}

export interface CreateMessagePayload {
  receiver_id: string;
  content: string;
  content_type: 'text' | 'file';
  file_id?: string;
}

export interface CreateStoryPayload {
  file_id: string;
  time_delay: number;
  caption?: string;
}

export interface Friend {
  status: 'pending' | 'accepted';
  created_at: string;
  user_id1?: AppUser;
  user_id2?: AppUser;
  other_user: AppUser;
  type: 'incoming' | 'outgoing' | 'friend';
}

export interface Profile extends SupabaseUser {
  username: string | null;
  file_id: string | null;
  interests: string[] | null;
  avatar_url?: string | null;
} 