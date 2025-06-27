import { StyleSheet, useColorScheme, FlatList, ActivityIndicator, Text } from 'react-native';
import { View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { MessageCard } from '@/components/MessageCard';
import { useEffect, useState } from 'react';
import { getConversations } from '@/lib/api';
import { Conversation } from '@/types/supabase';
import { useIsFocused } from '@react-navigation/native';

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const isFocused = useIsFocused();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoading(true);
        const data = await getConversations();
        setConversations(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    if (isFocused) {
      fetchConversations();
    }
  }, [isFocused]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <Text style={{ color: themeColors.error }}>Error: {error}</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Header title="Chat" />
      <FlatList
        data={conversations}
        renderItem={({ item }) => <MessageCard item={item} />}
        keyExtractor={(item) => item.other_user_id}
        contentContainerStyle={{ backgroundColor: themeColors.background }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 