import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { getDiscoverableUsers, sendFriendRequest } from '@/lib/api';
import { User } from '@/types/supabase';
import { Avatar } from '@/components/Avatar';
import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

export default function AddFriendModal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useApiQuery({
    queryKey: ['discoverable-users'],
    queryFn: getDiscoverableUsers,
  });

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

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  function handleAddFriend(userId: string) {
    addFriend(userId);
  }

  function renderUser({ item }: { item: User }) {
    const isRequestSent = sentRequests.includes(item.id);
    return (
      <View style={[styles.userRow, { borderBottomColor: themeColors.border }]}>
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
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Stack.Screen options={{
        headerStyle: { backgroundColor: themeColors.card },
        headerTintColor: themeColors.text,
        headerTitleStyle: { color: themeColors.text },
      }}/>
      <View style={[styles.searchContainer, { backgroundColor: themeColors.card }]}>
        <TextInput
          style={[styles.searchInput, { color: themeColors.text, backgroundColor: themeColors.background }]}
          placeholder="Search for friends..."
          placeholderTextColor={themeColors.text}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={themeColors.primary} />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{error.message}</Text>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
}); 