export interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
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
  user: Pick<User, 'username' | 'avatar_url'>;
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
export type UpdateUserPayload = Partial<Pick<User, 'username' | 'avatar_url'>>;

export interface CreateMessagePayload {
  receiver_id: string;
  content_type: 'text' | 'file';
  content?: string;
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
  user_id1?: User;
  user_id2?: User;
  other_user: User;
  type: 'incoming' | 'outgoing' | 'friend';
} 