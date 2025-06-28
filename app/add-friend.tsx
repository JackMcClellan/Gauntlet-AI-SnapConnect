import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator, useColorScheme, Alert, ScrollView } from 'react-native';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { getDiscoverableUsers, sendFriendRequest, getFriends, acceptFriendRequest, removeFriend } from '@/lib/api';
import { User, Friend } from '@/types/supabase';
import { Avatar } from '@/components/Avatar';
import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { useSession } from '@/providers/auth';

// Friend Request Card Component
function FriendRequestCard({ friend, themeColors }: { friend: Friend, themeColors: any }) {
  const queryClient = useQueryClient();
  const { mutate: acceptRequest, isPending: isAccepting } = useApiMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      Alert.alert('Success', 'Friend request accepted.');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err) => Alert.alert('Error', `Failed to accept: ${err.message}`)
  });

  const { mutate: declineRequest, isPending: isDeclining } = useApiMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      Alert.alert('Success', 'Friend request declined.');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (err) => Alert.alert('Error', `Failed to decline: ${err.message}`)
  });

  const friendProfile = friend.other_user;

  return (
    <View style={[styles.userRow, { borderBottomColor: themeColors.border }]}>
      <Avatar imageUrl={friendProfile.avatar_url} fullName={friendProfile.username} size={40} />
      <Text style={[styles.username, { color: themeColors.text }]}>{friendProfile.username || 'No username'}</Text>
      <View style={styles.actionButtons}>
        <Button title="Accept" onPress={() => acceptRequest(friendProfile.id)} disabled={isAccepting} size="sm" />
        <Button title="Decline" onPress={() => declineRequest(friendProfile.id)} variant="destructive" disabled={isDeclining} size="sm" />
      </View>
    </View>
  );
}

// Add Friend Modal Screen
export default function AddFriendModal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const queryClient = useQueryClient();
  const { session } = useSession();

  // --- Queries ---
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useApiQuery({
    queryKey: ['discoverable-users'],
    queryFn: getDiscoverableUsers,
  });

  const { data: friends, isLoading: isLoadingFriends, error: friendsError } = useApiQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
  });

  // --- Mutations ---
  const { mutate: addFriend } = useApiMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (_, friendId) => {
      setSentRequests(prev => [...prev, friendId]);
      queryClient.invalidateQueries({ queryKey: ['discoverable-users'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error) => {
      console.error('Failed to send friend request:', error);
      alert(`Failed to send friend request: ${error.message}`);
    },
  });

  // --- Memos ---
  const pendingRequests = useMemo(() => {
    if (!friends) return [];
    return friends.filter(f => f.type === 'incoming');
  }, [friends]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // --- Handlers ---
  function handleAddFriend(userId: string) {
    addFriend(userId);
  }

  // --- Render Functions ---
  function renderUser({ item }: { item: User }) {
    const isRequestSent = sentRequests.includes(item.id);
    return (
      <View style={[styles.userRow, { borderBottomColor: themeColors.border, paddingVertical: 10 }]}>
        <Avatar imageUrl={item.avatar_url} fullName={item.username} size={40} />
        <Text style={[styles.username, { color: themeColors.text }]}>{item.username || 'No username'}</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: isRequestSent ? themeColors.background : themeColors.primary }]}
          onPress={() => handleAddFriend(item.id)}
          disabled={isRequestSent}
        >
          <Text style={{ color: isRequestSent ? themeColors.text : themeColors.card }}>{isRequestSent ? 'Sent' : 'Add'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Stack.Screen options={{
        title: 'Add or Manage Friends',
        headerStyle: { backgroundColor: themeColors.card },
        headerTintColor: themeColors.text,
        headerTitleStyle: { color: themeColors.text },
      }}/>

      {/* Pending Requests Section */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Pending Requests</Text>
        {isLoadingFriends ? <ActivityIndicator color={themeColors.primary} /> :
         friendsError ? <Text style={{color: 'red'}}>{friendsError.message}</Text> :
         pendingRequests.length === 0 ? <Text style={{color: themeColors.text, textAlign: 'center', marginTop: 10}}>No pending requests.</Text> :
         pendingRequests.map(req => <FriendRequestCard key={req.other_user.id} friend={req} themeColors={themeColors} />)
        }
      </View>

      {/* Discover Users Section */}
      <View style={[styles.sectionContainer, { borderTopColor: themeColors.border, borderTopWidth: 1, marginTop: 20 }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Discover New Friends</Text>
        <View style={[styles.searchContainer, { backgroundColor: themeColors.card }]}>
          <TextInput
            style={[styles.searchInput, { color: themeColors.text, backgroundColor: themeColors.background }]}
            placeholder="Search by username..."
            placeholderTextColor={themeColors.text}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {isLoadingUsers ? <ActivityIndicator style={{ marginTop: 20 }} color={themeColors.primary} /> :
         usersError ? <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{usersError.message}</Text> :
         <FlatList
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            scrollEnabled={false} // The outer view is a ScrollView
         />
        }
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionContainer: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
  },
  username: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  }
}); 