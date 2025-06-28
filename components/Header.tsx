import React from 'react';
import { View, Text, StyleSheet, useColorScheme, SafeAreaView, Pressable, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { IconButton } from './IconButton';
import { Search, UserPlus, MoreHorizontal, Users } from 'lucide-react-native';
import { useApiQuery } from '@/hooks/use-api';
import { getFriends, getUser } from '@/lib/api';
import { useSession } from '@/providers/auth';
import { Avatar } from './Avatar';

interface HeaderProps {
  title?: string;
  right?: React.ReactNode;
}

export function Header({ title, right }: HeaderProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { signOut, session } = useSession();

  const { data: user, isLoading: isLoadingUser } = useApiQuery({
    queryKey: ['user', session?.user?.id],
    queryFn: () => getUser(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  const { data: friends } = useApiQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
  });



  const pendingRequestsCount = friends?.filter(f => f.status === 'pending' && f.type === 'incoming').length || 0;

  return (
    <SafeAreaView style={{ backgroundColor: themeColors.card }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.headerContainer, { borderBottomColor: themeColors.background }]}>
        <View style={styles.sideContainer}>
          <Pressable onPress={() => router.push('/profile')} style={[styles.avatarButton, {backgroundColor: themeColors.background}]}>
          <Avatar
            imageUrl={user?.avatar_url}
            fullName={user?.username}
            size={40}
          />
          </Pressable>
        </View>

        {title && <Text style={[styles.headerTitle, { color: themeColors.text }]}>{title}</Text>}

        <View style={styles.sideContainer}>
          {right || (
              <View>
                <IconButton icon={Users} onPress={() => router.push('/add-friend')} />
                {pendingRequestsCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: themeColors.primary }]}>
                    <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
                  </View>
                )}
              </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 10,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  sideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    right: -5,
    top: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 