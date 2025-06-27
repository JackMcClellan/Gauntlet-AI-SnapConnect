import { supabase } from './supabase';
import {
  User,
  UpdateUserPayload,
  File as DBFile,
  Message,
  CreateMessagePayload,
  Story,
  CreateStoryPayload,
  Conversation
} from '../types/supabase';

const FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// A helper to create a consistent API call structure
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${FUNCTION_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    }
  });
  return handleResponse<T>(response);
}

// --- Users ---
export const getUser = (id: string) => 
  apiFetch<User>(`/users/${id}`);

export const updateUser = (id: string, payload: UpdateUserPayload) => 
  apiFetch<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

// --- Files ---
export const uploadFile = async (file: File, caption?: string, tags?: string[]) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User not authenticated');

  const formData = new FormData();
  formData.append('file', file);
  if (caption) formData.append('caption', caption);
  if (tags) formData.append('tags', tags.join(','));
  
  const response = await fetch(`${FUNCTION_URL}/files`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` }, // No 'Content-Type' for multipart/form-data
    body: formData,
  });
  return handleResponse<DBFile>(response);
};

export const deleteFile = (id: string) => 
  apiFetch<DBFile>(`/files/${id}`, { method: 'DELETE' });

// --- Messages ---
export const getMessages = (receiverId: string) =>
  apiFetch<Message[]>(`/messages?receiver_id=${receiverId}`);

export const createMessage = (payload: CreateMessagePayload) =>
  apiFetch<Message>('/messages', { method: 'POST', body: JSON.stringify(payload) });

// --- Stories ---
export const getStories = () => 
  apiFetch<Story[]>('/stories');

export const createStory = (payload: CreateStoryPayload) =>
  apiFetch<Story>('/stories', { method: 'POST', body: JSON.stringify(payload) });

export const deleteStory = (id: string) =>
  apiFetch<Story>(`/stories/${id}`, { method: 'DELETE' });

// --- Conversations ---
export const getConversations = () =>
  apiFetch<Conversation[]>('/conversations'); 