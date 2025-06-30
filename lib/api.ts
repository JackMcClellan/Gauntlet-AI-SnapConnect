import { supabase } from './supabase';
import {
  AppUser,
  UpdateUserPayload,
  File as DBFile,
  Message,
  CreateMessagePayload,
  Story,
  CreateStoryPayload,
  Conversation,
  Friend,
  Profile,
  CaptionRequest,
  CaptionResponse,
  TagRequest,
  TagResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  RAGSearchRequest,
  RAGSearchResponse
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
export const getMe = () => 
  apiFetch<Profile>('/users/me');

export const getUser = (id: string) => 
  apiFetch<AppUser>(`/users/${id}`);

export const updateUser = (id: string, payload: UpdateUserPayload) => 
  apiFetch<AppUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export async function getDiscoverableUsers(): Promise<AppUser[]> {
  return apiFetch('/users');
}

// --- Friend Management ---
export const getFriends = () =>
  apiFetch<Friend[]>(`/friends`);

export const sendFriendRequest = (receiverId: string) =>
  apiFetch<Friend>('/friends', { method: 'POST', body: JSON.stringify({ receiver_id: receiverId }) });

export const acceptFriendRequest = (senderId: string) =>
  apiFetch<Friend>(`/friends/${senderId}`, { method: 'PATCH' });

export const removeFriend = (friendId: string) =>
  apiFetch<Friend>(`/friends/${friendId}`, { method: 'DELETE' });

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

export const sendSnap = async (uri: string, selections: { toStory: boolean; toPublic: boolean; toFriends: string[] }, caption?: string, userContext?: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User not authenticated');

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: uri.split('/').pop(),
    type: 'image/jpeg',
  } as any);
  
  if (caption) formData.append('caption', caption);
  if (userContext) formData.append('userContext', userContext);
  formData.append('toStory', String(selections.toStory));
  formData.append('toPublic', String(selections.toPublic));
  formData.append('toFriends', JSON.stringify(selections.toFriends));

  const response = await fetch(`${FUNCTION_URL}/send-snap`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
    body: formData,
  });
  return handleResponse<{ success: boolean; fileId: string }>(response);
};

export const createPublicPost = async (
  uri: string, 
  caption: string, 
  tags: string[], // Keep for compatibility but ignore
  selections: { toStory: boolean; toFriends: string[] }
) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User not authenticated');

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: uri.split('/').pop(),
    type: 'image/jpeg',
  } as any);
  
  formData.append('caption', caption);
  formData.append('toStory', String(selections.toStory));
  formData.append('toPublic', 'true'); // Always true for public posts
  formData.append('toFriends', JSON.stringify(selections.toFriends));

  const response = await fetch(`${FUNCTION_URL}/send-snap`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
    body: formData,
  });
  return handleResponse<{ success: boolean; fileId: string }>(response);
};

export const uploadFileFromUri = async (uri: string, caption?: string, tags?: string[]) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('User not authenticated');

  const formData = new FormData();
  // The type assertion is needed because React Native's FormData.append expects a different type
  formData.append('file', {
    uri,
    name: uri.split('/').pop(),
    type: 'image/jpeg', // Assuming jpeg, this could be made dynamic
  } as any);

  if (caption) formData.append('caption', caption);
  if (tags) formData.append('tags', tags.join(','));

  const response = await fetch(`${FUNCTION_URL}/files`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
    body: formData,
  });
  return handleResponse<DBFile>(response);
};

// --- Messages ---
export const getMessages = (receiverId: string) =>
  apiFetch<Message[]>(`/messages/${receiverId}`);

export const createMessage = (payload: CreateMessagePayload) =>
  apiFetch<Message>('/messages', { method: 'POST', body: JSON.stringify(payload) });

// --- Stories ---
export const getStories = () => 
  apiFetch<Story[]>('/stories');

export const getPosts = () => 
  apiFetch<Story[]>('/posts');

export const getPost = (id: string) => 
  apiFetch<Story>(`/posts/${id}`);

export const createStory = (payload: CreateStoryPayload) =>
  apiFetch<Story>('/stories', { method: 'POST', body: JSON.stringify(payload) });

export const deleteStory = (id: string) =>
  apiFetch<Story>(`/stories/${id}`, { method: 'DELETE' });

// --- Conversations ---
export const getConversations = () =>
  apiFetch<Conversation[]>('/conversations');

// --- AI Caption Generation ---
export const generateAiCaption = (payload: CaptionRequest) =>
  apiFetch<CaptionResponse>('/ai-caption', { method: 'POST', body: JSON.stringify(payload) });

// --- AI Tag Generation ---
export const generateAiTags = (payload: TagRequest) =>
  apiFetch<TagResponse>('/ai-tags', { method: 'POST', body: JSON.stringify(payload) });

// --- Embedding Generation ---
export const generateEmbedding = (payload: EmbeddingRequest) =>
  apiFetch<EmbeddingResponse>('/generate-embedding', { method: 'POST', body: JSON.stringify(payload) });

// --- RAG Search ---
export const ragSearch = (payload: RAGSearchRequest) =>
  apiFetch<RAGSearchResponse>('/rag-search', { method: 'POST', body: JSON.stringify(payload) }); 