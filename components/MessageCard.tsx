// This is a new file
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { DUMMY_CHATS } from '@/constants/DummyData';
import Colors from '@/constants/Colors';

type MessageCardProps = {
  item: (typeof DUMMY_CHATS)[0];
};

export function MessageCard({ item }: MessageCardProps) {
  const hasUnread = item.unreadCount > 0;

  return (
    <Link href={`/chat/${item.id}`} asChild>
      <TouchableOpacity style={styles.container}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.content}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
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
    color: Colors.light.text,
    fontSize: 14,
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