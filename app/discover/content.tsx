import React from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, useWindowDimensions, Text } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { DUMMY_DISCOVER_CONTENT, DUMMY_CHATS } from '@/constants/DummyData';
import { X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';

export default function DiscoverContentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();

  const content = DUMMY_DISCOVER_CONTENT.find((c) => c.id === id);
  const user = content ? DUMMY_CHATS.find((c) => c.id === content.userId) : null;

  if (!content || !user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <View style={styles.contentContainer}>
        {content.type === 'image' ? (
          <Image source={{ uri: content.url }} style={{ width, height }} contentFit="contain" />
        ) : (
          <Video
            source={{ uri: content.url }}
            style={{ width, height }}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay
            useNativeControls
          />
        )}
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <X size={32} color="white" />
      </TouchableOpacity>
      <View style={styles.userInfoContainer}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.username}>{user.name}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  userInfoContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 