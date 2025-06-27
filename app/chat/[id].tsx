import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { getMessages, createMessage, getUser } from '@/lib/api';
import { Message } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useColorScheme } from 'react-native';
import { Avatar } from '@/components/Avatar';

type ChatMessageProps = {
  item: Message;
  isMyMessage: boolean;
};

function ChatMessage({ item, isMyMessage }: ChatMessageProps) {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']

    return (
        <View style={[styles.messageRow, { justifyContent: isMyMessage ? 'flex-end' : 'flex-start'}]}>
            <View style={[styles.messageBubble, { backgroundColor: isMyMessage ? themeColors.primary : themeColors.border}]}>
                <Text style={{ color: isMyMessage ? themeColors.card : themeColors.text }}>{item.content}</Text>
            </View>
        </View>
    )
}

export default function ChatScreen() {
  const { id: receiverId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [receiverUser, setReceiverUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme()
  const themeColors = Colors[colorScheme ?? 'light']

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        setCurrentUser(user);
        
        const [initialMessages, receiverData] = await Promise.all([
          getMessages(receiverId),
          getUser(receiverId),
        ]);
        
        setMessages(initialMessages.slice().reverse());
        setReceiverUser(receiverData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, [receiverId]);
  
  // Realtime subscription for new messages
  useEffect(() => {
    if (!receiverId) return;

    const channel = supabase
      .channel(`messages_for_${receiverId}`)
      .on<Message>(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${currentUser?.id}`
        },
        (payload) => {
          setMessages((prevMessages) => [payload.new, ...prevMessages]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [receiverId, currentUser]);

  const handleSend = async () => {
    if (newMessage.trim() === '' || !receiverId) return;
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser!.id,
      receiver_id: receiverId,
      content: newMessage.trim(),
      content_type: 'text',
      created_at: new Date().toISOString(),
      file_id: null,
    };
    
    setMessages((prevMessages) => [optimisticMessage, ...prevMessages]);
    setNewMessage('');

    try {
      await createMessage({
        receiver_id: receiverId,
        content: newMessage.trim(),
        content_type: 'text'
      })
    } catch (err) {
      console.error("Failed to send message:", err);
      // Optionally, handle the error by removing the optimistic message
      // setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };
  
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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={150}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar 
                  imageUrl={receiverUser?.avatar_url}
                  fullName={receiverUser?.username}
                  size={40}
                />
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginLeft: 10 }}>{receiverUser?.username || 'Chat'}</Text>
              </View>
            ),
          }}
        />
        <FlatList
          data={messages}
          renderItem={({ item }) => <ChatMessage item={item} isMyMessage={item.sender_id === currentUser?.id} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
          inverted
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Send size={20} color={themeColors.card} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 