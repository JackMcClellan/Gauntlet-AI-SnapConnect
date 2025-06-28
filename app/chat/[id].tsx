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
  useColorScheme,
  Pressable,
  Modal,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { getMessages, createMessage, getUser } from '@/lib/api';
import { Message } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/Avatar';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { Image } from 'expo-image';

type ChatMessageProps = {
  item: Message;
  isMyMessage: boolean;
  onSelectMedia: (uri: string) => void;
};

function ChatMessage({ item, isMyMessage, onSelectMedia }: ChatMessageProps) {
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']

    return (
        <View style={[styles.messageRow, { justifyContent: isMyMessage ? 'flex-end' : 'flex-start'}]}>
            <View style={[
                styles.messageBubble, 
                { backgroundColor: isMyMessage ? themeColors.primary : themeColors.border },
                item.file_url && { padding: 2, width: 200, height: 200 }
            ]}>
                {item.file_url ? (
                    <Pressable onPress={() => onSelectMedia(item.file_url!)}>
                        <Image source={{ uri: item.file_url }} style={styles.chatImage} contentFit="cover" />
                    </Pressable>
                ) : (
                    <Text style={{ color: isMyMessage ? themeColors.card : themeColors.text }}>{item.content}</Text>
                )}
            </View>
        </View>
    )
}

function MediaModal({ uri, onDismiss }: { uri: string | null, onDismiss: () => void }) {
  if (!uri) return null;
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={!!uri}
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.modalContainer} onTouchEnd={onDismiss}>
        <Image source={{ uri }} style={styles.fullscreenImage} contentFit="contain" />
        <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

export default function ChatScreen() {
  const { id: receiverId } = useLocalSearchParams<{ id: string }>();
  const [newMessage, setNewMessage] = useState('');
  const [selectedMediaUri, setSelectedMediaUri] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const { data: currentUser } = useApiQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: messages, isLoading: isLoadingMessages, isError: isErrorMessages } = useApiQuery({
    queryKey: ['messages', receiverId],
    queryFn: () => getMessages(receiverId!),
    enabled: !!receiverId,
  });

  const { data: receiverUser, isLoading: isLoadingUser } = useApiQuery({
    queryKey: ['user', receiverId],
    queryFn: () => getUser(receiverId!),
    enabled: !!receiverId,
  });

  const mutation = useApiMutation({
    mutationFn: createMessage,
    onMutate: async (newMessageData) => {
      setNewMessage('');
      await queryClient.cancelQueries({ queryKey: ['messages', receiverId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', receiverId]);
      
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: currentUser!.id,
        receiver_id: receiverId!,
        content: newMessageData.content!,
        content_type: 'text',
        created_at: new Date().toISOString(),
        file_id: null,
      };

      queryClient.setQueryData<Message[]>(
        ['messages', receiverId],
        (old = []) => [optimisticMessage, ...old]
      );

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(['messages', receiverId], context?.previousMessages);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSend = () => {
    if (newMessage.trim() === '' || !receiverId) return;
    mutation.mutate({ receiver_id: receiverId, content: newMessage.trim(), content_type: 'text' });
  };
  
  const isLoading = isLoadingMessages || isLoadingUser;
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    )
  }

  if (isErrorMessages) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }}>
        <Text style={{ color: themeColors.error }}>Error loading messages.</Text>
      </View>
    )
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]} edges={['bottom']}>
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
                {receiverUser ? (
                  <>
                    <Avatar 
                      imageUrl={receiverUser.avatar_url}
                      fullName={receiverUser.username}
                      size={36}
                    />
                    <Text style={{ fontWeight: 'bold', fontSize: 16, marginLeft: 10, color: themeColors.text }}>
                      {receiverUser.username || 'Chat'}
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: themeColors.text }}>
                    Chat
                  </Text>
                )}
              </View>
            ),
            headerStyle: { backgroundColor: themeColors.background },
            headerTintColor: themeColors.primary,
          }}
        />
        <FlatList
          data={messages || []}
          renderItem={({ item }) => <ChatMessage item={item} isMyMessage={item.sender_id === currentUser?.id} onSelectMedia={setSelectedMediaUri} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10, backgroundColor: themeColors.background }}
          inverted
        />

        <View style={[styles.inputContainer, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={themeColors.text}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: themeColors.primary }]} onPress={handleSend}>
            <Send size={20} color={themeColors.card} />
          </TouchableOpacity>
        </View>
        <MediaModal uri={selectedMediaUri} onDismiss={() => setSelectedMediaUri(null)} />
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
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  chatImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
}); 