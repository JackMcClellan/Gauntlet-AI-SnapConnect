import { supabase } from './supabase';

// Helper function to handle Supabase function invocation
async function invoke<T>(functionName: string, body: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    throw new Error(`Failed to call ${functionName}: ${error.message}`);
  }
  return data;
}

// Types based on your schema.md and function responses
// You might want to generate these automatically in the future (e.g., from OpenAPI spec)

interface Story {
  id: string;
  file_id: string;
  time_delay: number;
  caption: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface File {
  storage_path: string;
  file_type: 'image' | 'video';
}

export interface StoryWithRelations extends Story {
  user: UserProfile;
  file: File;
}

interface Conversation {
  other_user_id: string;
  other_user_username: string | null;
  other_user_avatar_url: string | null;
  last_message_id: string;
  last_message_content_type: 'text' | 'file';
  last_message_content: string | null;
  last_message_created_at: string;
}

interface Message {
  id: string;
  receiver_id: string;
  content_type: 'text' | 'file';
  content: string | null;
  file_id: string | null;
  created_at: string;
}

// API Functions

/**
 * Creates a new story.
 * @param story - The story data.
 */
export const createStory = (story: {
  file_type: 'image' | 'video';
  storage_path: string;
  caption?: string;
  tags?: string[];
  time_delay: number;
}) => invoke<{ story: Story }>('create-story', story);

/**
 * Fetches the main stories feed.
 */
export const getStoriesFeed = () => invoke<{ stories: StoryWithRelations[] }>('get-stories-feed', {});

/**
 * Sends a direct message.
 * @param message - The message data.
 */
export const sendMessage = (message: {
  receiver_id: string;
  content_type: 'text' | 'file';
  content?: string;
  file?: {
    file_type: 'image' | 'video';
    storage_path: string;
    caption?: string;
    tags?: string[];
  };
}) => invoke<{ message: Message }>('send-message', message);

/**
 * Fetches the user's conversation list.
 */
export const getConversations = () => invoke<{ conversations: Conversation[] }>('get-conversations', {}); 