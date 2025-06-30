import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, useWindowDimensions, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Story } from '@/types/supabase';
import { getPost } from '@/lib/api';

export default function ContentScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { width, height } = useWindowDimensions();
  
  const [post, setPost] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      
      try {
        const postData = await getPost(postId);
        setPost(postData);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
        <View style={[styles.contentContainer, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="white" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post || !post.file) {
    return null;
  }

  const fileUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${post.file.storage_path}`;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />
      <View style={styles.contentContainer}>
        {post.file.file_type === 'image' ? (
          <Image source={{ uri: fileUrl }} style={{ width, height }} contentFit="contain" />
        ) : (
          <Video
            source={{ uri: fileUrl }}
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
        <Image 
          source={{ uri: post.user.avatar_url || 'https://via.placeholder.com/30' }} 
          style={styles.avatar} 
        />
        <View style={styles.textContainer}>
          <Text style={styles.username}>{post.user.username || 'Unknown'}</Text>
          {post.caption && (
            <Text style={styles.caption}>{post.caption}</Text>
          )}
        </View>
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
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: '80%',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
}); 