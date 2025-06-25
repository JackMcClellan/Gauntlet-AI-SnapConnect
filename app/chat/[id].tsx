import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import Colors from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { sendMessage, getMessages, Message } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/auth';

function ChatMessage({ item, currentUserId }: { item: Message; currentUserId: string }) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const isMyMessage = item.sender_id === currentUserId;

  return (
    <View style={[styles.messageRow, { justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }]}>
      {!isMyMessage && (
        <Image
          source={{
            uri: item.senderProfile?.avatar_url || 'https://placekitten.com/30/30',
          }}
          style={styles.avatar}
        />
      )}
      <View
        style={[
          styles.messageBubble,
          { backgroundColor: isMyMessage ? themeColors.primary : themeColors.border },
        ]}
      >
        <Text style={{ color: isMyMessage ? '#fff' : themeColors.text }}>{item.content}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const otherUserId = params.id;
  const { session } = useSession();
  const currentUserId = session?.user?.id;
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const navigation = useNavigation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserProfile, setOtherUserProfile] = useState<any | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!currentUserId || !otherUserId) return;

    try {
      const fetchedMessages = await getMessages(otherUserId);
      setMessages(fetchedMessages);

      // Extract other user's profile from the first message if available
      if (fetchedMessages.length > 0) {
        const firstMessage = fetchedMessages[0];
        if (firstMessage.sender_id !== currentUserId) {
          setOtherUserProfile(firstMessage.senderProfile);
        } else {
          // If the first message is ours, we need to find their profile.
          // This part of the logic might need a dedicated `getUser` endpoint if a user has no messages.
          // For now, we assume the conversation exists.
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', otherUserId)
            .single();
          setOtherUserProfile(profileData);
        }
      } else {
        // No messages yet, fetch profile directly
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', otherUserId)
          .single();
        setOtherUserProfile(profileData);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`chat:${otherUserId}`)
      .on<any>( // Fallback to any
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          // When a new message arrives, fetch the sender's profile
          const { data: senderProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();
          
          const newMessageWithProfile = {
            ...payload.new,
            senderProfile,
          };
          setMessages((prevMessages) => [newMessageWithProfile as Message, ...prevMessages]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, otherUserId, currentUserId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={{ uri: otherUserProfile?.avatar_url || 'https://placekitten.com/40/40' }}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
          />
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: themeColors.text }}>
            {otherUserProfile?.username || 'Chat'}
          </Text>
        </View>
      ),
    });
  }, [navigation, otherUserProfile, themeColors]);

  const handleSend = async () => {
    if (newMessage.trim() === '' || !otherUserId) return;
    const content = newMessage.trim();
    setNewMessage('');

    // Optimistically update the UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId!,
      receiver_id: otherUserId,
      content_type: 'text',
      content,
      file_id: null,
      created_at: new Date().toISOString(),
      senderProfile: null, // We don't have this immediately
    };
    setMessages((prevMessages) => [optimisticMessage, ...prevMessages]);

    try {
      await sendMessage({
        receiver_id: otherUserId,
        content_type: 'text',
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Optional: handle error, e.g., show an error message and remove the optimistic message
    }
  };

  if (!currentUserId) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ headerStyle: { backgroundColor: themeColors.background }, headerTintColor: themeColors.primary }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={messages}
          renderItem={({ item }) => <ChatMessage item={item} currentUserId={currentUserId} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
          inverted
        />

        <View style={[styles.inputContainer, { borderTopColor: themeColors.border, backgroundColor: themeColors.card }]}>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text }]}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            placeholderTextColor={themeColors.text}
          />
          <TouchableOpacity style={[styles.sendButton, {backgroundColor: themeColors.primary}]} onPress={handleSend}>
            <Ionicons name="send" size={20} color={'#fff'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
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
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 