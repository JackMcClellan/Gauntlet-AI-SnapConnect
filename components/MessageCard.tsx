// This is a new file
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { Conversation } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from './Avatar';

type MessageCardProps = {
  item: Conversation;
};

export function MessageCard({ item }: MessageCardProps) {
  // TODO: Implement unread count logic if needed
  // const hasUnread = item.unreadCount > 0;
  const lastMessageTimestamp = item.last_message_created_at 
    ? formatDistanceToNow(new Date(item.last_message_created_at), { addSuffix: true })
    : '';

  return (
    <Link href={`/chat/${item.other_user_id}`} asChild>
      <TouchableOpacity style={styles.container}>
        <Avatar
          imageUrl={item.other_user_avatar_url}
          fullName={item.other_user_username}
        />
        <View style={styles.content}>
          <Text style={styles.name}>{item.other_user_username || 'Anonymous'}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message_content}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.timestamp}>{lastMessageTimestamp}</Text>
          {/* {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )} */}
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
    borderBottomColor: Colors.light.border,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  lastMessage: {
    color: Colors.light.text,
    fontSize: 14,
    fontStyle: 'italic',
  },
  meta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    color: Colors.light.text,
    fontSize: 12,
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 