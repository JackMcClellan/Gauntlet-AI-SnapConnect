import React from 'react';
import { useStorageState } from '@/hooks/useStorageState';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

const AuthContext = React.createContext<{
  signIn: (email?: string, password?: string) => void;
  signUp: (email?: string, password?: string) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signUp: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = React.useContext(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }
  return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.access_token ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session?.access_token ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
        },
        session,
        isLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
} 