import React, { useEffect, createContext, useContext, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useAtom } from 'jotai';
import { profileAtom } from '@/store/auth';
import { getMe } from '@/lib/api';
import { Alert } from 'react-native';

const AuthContext = createContext<{
  signIn: (email?: string, password?: string) => void;
  signUp: (email?: string, password?: string) => void;
  signOut: () => void;
  session?: Session | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signUp: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }
  return value;
}

function useProtectedRoute(session: Session | null, isLoading: boolean) {
  const [profile, setProfile] = useAtom(profileAtom);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. Don't do anything until the initial session loading is complete.
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    // 2. If there's no session, and we're not in the auth flow, redirect to login.
    if (!session) {
      if (!inAuthGroup) {
        router.replace('/login');
      }
      return;
    }

    // 3. If there IS a session, we need a profile.
    if (!profile) {
      getMe()
        .then(fetchedProfile => {
          setProfile(fetchedProfile);
          // After fetching, decide where to go based on the new profile data.
          if (!fetchedProfile?.username) {
            router.replace('/onboard');
          } else if (inAuthGroup) {
            router.replace('/(tabs)');
          }
        })
        .catch(err => {
          console.error('Failed to get profile:', err);
          // Fallback to login on error
          router.replace('/login');
        });
    } else {
      // 4. We already have a session and a profile. Decide where to go.
      if (!profile.username) {
        router.replace('/onboard');
      } else if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [session, profile, isLoading, segments]);
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setProfile] = useAtom(profileAtom);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  useProtectedRoute(session, isLoading);

  return (
    <AuthContext.Provider
      value={{
        signIn: async (email, password) => {
          if (!email || !password) return;
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) Alert.alert('Error', error.message);
        },
        signUp: async (email, password) => {
          if (!email || !password) return;
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            Alert.alert('Success', 'Please check your email to confirm your account.');
          }
        },
        signOut: () => {
          supabase.auth.signOut();
          setProfile(null);
        },
        session,
        isLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
} 