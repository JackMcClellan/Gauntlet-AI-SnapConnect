import { supabase } from './supabase';

async function invoke<T>(
  functionName: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: Record<string, any>;
  }
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, options);
  if (error) {
    throw new Error(`Failed to call ${functionName}: ${error.message}`);
  }
  return data;
}

// --- Type Definitions ---
// These should ideally be generated from your DB schema

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface File {
  storage_path: string;
  file_type: 'image' | 'video';
}

export interface Story {
  id: string;
  file_id: string;
  time_delay: number;
  caption: string | null;
  created_at: string;
  user: UserProfile;
  file: File;
}

export interface Conversation {
  other_user_id: string;
  other_user_username: string | null;
  other_user_avatar_url: string | null;
  last_message_id: string;
  last_message_content_type: 'text' | 'file';
  last_message_content: string | null;
  last_message_created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content_type: 'text' | 'file';
  content: string | null;
  file_id: string | null;
  created_at: string;
  senderProfile?: UserProfile | null;
}

// --- API Functions ---

// USERS
export const getUsers = () => invoke<UserProfile[]>('users', { method: 'GET' });
export const getUserById = (id: string) => invoke<UserProfile>('users', { method: 'GET', body: { id } });
export const updateUser = (updates: Partial<UserProfile>) => invoke<UserProfile>('users', { method: 'PATCH', body: updates });

// MESSAGES
export const getConversations = () => invoke<Conversation[]>('messages', { method: 'GET' });
export const getMessages = (other_user_id: string) => invoke<Message[]>('messages', { method: 'GET', body: { other_user_id } });
export const sendMessage = (message: {
  receiver_id: string;
  content_type: 'text' | 'file';
  content?: string;
  file?: { file_type: 'image' | 'video'; storage_path: string };
}) => invoke<Message>('messages', { method: 'POST', body: message });

// STORIES
export const getStories = () => invoke<Story[]>('stories', { method: 'GET' });
export const createStory = (story: {
  file_type: 'image' | 'video';
  storage_path: string;
  caption?: string;
  tags?: string[];
  time_delay: number;
}) => invoke<Story>('stories', { method: 'POST', body: story });
export const deleteStory = (id: string) => invoke<{ message: string }>('stories', { method: 'DELETE', body: { id } }); 