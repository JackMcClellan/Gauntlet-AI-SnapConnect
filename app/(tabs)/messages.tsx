import { StyleSheet, useColorScheme, FlatList } from 'react-native';
import { View, Text } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { getConversations } from '@/lib/api';
import { MessageCard } from '@/components/MessageCard';
import { useEffect, useState } from 'react';
import { Conversation } from '@/lib/api';
import { IconButton } from '@/components/IconButton';
import { useRouter } from 'expo-router';

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const { conversations: data } = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Header
        title="Chat"
        right={<IconButton name="plus-square" onPress={() => router.push('/new-chat')} />}
      />
      {isLoading ? (
        <View style={styles.centered}>
          <Text>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={({ item }) => <MessageCard conversation={item} />}
          keyExtractor={(item) => item.other_user_id}
          contentContainerStyle={{ backgroundColor: themeColors.background }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text>No conversations yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 