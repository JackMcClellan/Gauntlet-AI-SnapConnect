import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { getUsers } from '@/lib/api';

type User = any;

export default function NewChatScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { users: fetchedUsers } = await getUsers();
        setUsers(fetchedUsers || []);
      } catch (e) {
        console.error('Error fetching users:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserPress = (user: User) => {
    router.replace(`/chat/${user.id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.text }}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.userRow, { borderBottomColor: themeColors.border }]}
            onPress={() => handleUserPress(item)}
          >
            <Image
              source={{ uri: item.avatar_url || 'https://placekitten.com/50/50' }}
              style={styles.avatar}
            />
            <Text style={[styles.username, { color: themeColors.text }]}>{item.username || 'User'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ color: themeColors.text, textAlign: 'center', marginTop: 20 }}>
            No other users found.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 