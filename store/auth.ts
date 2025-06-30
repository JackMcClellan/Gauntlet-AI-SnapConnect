import { atom } from 'jotai';
import { Profile } from '@/types/supabase';

export const profileAtom = atom<Profile | null>(null); 