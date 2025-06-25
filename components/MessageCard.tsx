// This is a new file
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { Conversation } from '@/lib/api';
import { format } from 'date-fns';

type MessageCardProps = {
  conversation: Conversation;
};

export function MessageCard({ conversation }: MessageCardProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const formattedTimestamp = format(new Date(conversation.last_message_created_at), 'p');

  return (
    <Link href={`/chat/${conversation.other_user_id}`} asChild>
      <TouchableOpacity style={[styles.container, { borderBottomColor: themeColors.border }]}>
        <Image
          source={{ uri: conversation.other_user_avatar_url || 'https://placekitten.com/50/50' }}
          style={styles.avatar}
        />
        <View style={styles.content}>
          <Text style={[styles.name, { color: themeColors.text }]}>
            {conversation.other_user_username || 'Unknown User'}
          </Text>
          <Text style={[styles.lastMessage, { color: themeColors.text }]} numberOfLines={1}>
            {conversation.last_message_content || '...'}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={[styles.timestamp, { color: themeColors.text }]}>{formattedTimestamp}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  meta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    marginBottom: 4,
  },
}); 