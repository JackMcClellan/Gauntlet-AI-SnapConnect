import React, { useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { DUMMY_CHATS, DUMMY_MESSAGES } from '@/constants/DummyData';
import Colors from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

type ChatMessageProps = {
  item: {
    id: string;
    text: string;
    sender: string;
    timestamp: string;
  };
};

function ChatMessage({ item }: ChatMessageProps) {
    const isMyMessage = item.sender === 'Me';
    return (
        <View style={[styles.messageRow, { justifyContent: isMyMessage ? 'flex-end' : 'flex-start'}]}>
            <View style={[styles.messageBubble, { backgroundColor: isMyMessage ? Colors.light.primary : Colors.light.border}]}>
                <Text style={{ color: isMyMessage ? Colors.light.card : Colors.light.text }}>{item.text}</Text>
            </View>
        </View>
    )
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chat = DUMMY_CHATS.find((c) => c.id === id);
  const [messages, setMessages] = useState(
    DUMMY_MESSAGES[id as keyof typeof DUMMY_MESSAGES]?.slice()?.reverse() || []
  );
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim() === '') return;
    const myMessage = {
      id: `m${Date.now()}`,
      text: newMessage.trim(),
      sender: 'Me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prevMessages) => [myMessage, ...prevMessages]);
    setNewMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={150}
      >
        <Stack.Screen
          options={{
            headerStyle: {
              backgroundColor: Colors.light.background,
            },
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={{ uri: chat?.avatar }}
                  style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                />
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{chat?.name}</Text>
              </View>
            ),
          }}
        />
        <FlatList
          data={messages}
          renderItem={({ item }) => <ChatMessage item={item} />}
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
            <Ionicons name="send" size={20} color={Colors.light.card} />
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