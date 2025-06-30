import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ImageBackground, TouchableOpacity, Text, SafeAreaView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { X } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle, runOnJS, cancelAnimation } from 'react-native-reanimated';
import { Story } from '@/types/supabase';

function ProgressBar({ 
  duration, 
  onFinish, 
  isActive, 
  isCompleted 
}: { 
  duration: number; 
  onFinish: () => void; 
  isActive: boolean;
  isCompleted: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isCompleted) {
      progress.value = 1;
    } else if (isActive) {
      progress.value = 0;
      progress.value = withTiming(1, { 
        duration, 
        easing: Easing.out(Easing.ease)
      }, (isFinished) => {
        if (isFinished) {
          runOnJS(onFinish)();
        }
      });
    } else {
      progress.value = 0;
    }

    return () => {
      cancelAnimation(progress);
    };
  }, [duration, onFinish, progress, isActive, isCompleted]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View style={[styles.progressBar, animatedStyle]} />
    </View>
  );
}

export default function StoryScreen() {
  const router = useRouter();
  const { storyData, allStoriesData } = useLocalSearchParams<{ 
    storyData: string; 
    allStoriesData: string;
  }>();
  
  const story: Story = JSON.parse(storyData || '{}');
  const allStories: Story[] = JSON.parse(allStoriesData || '[]');
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Group stories by user and find current user's stories
  const currentUserStories = allStories.filter(s => s.user_id === story.user_id);
  const currentStoryIndexInUserStories = currentUserStories.findIndex(s => s.id === story.id);

  // Find current story index in all stories
  useEffect(() => {
    const currentIndex = allStories.findIndex(s => s.id === story.id);
    if (currentIndex !== -1) {
      setCurrentStoryIndex(currentIndex);
    }
  }, [story.id, allStories]);

  const handlePressLeft = () => {
    // If we're not at the first story of this user, go to previous story of same user
    if (currentStoryIndexInUserStories > 0) {
      const prevStory = currentUserStories[currentStoryIndexInUserStories - 1];
      router.replace({
        pathname: '/discover/story',
        params: {
          storyData: JSON.stringify(prevStory),
          allStoriesData: JSON.stringify(allStories),
        },
      });
    } else {
      // Go to previous user's stories or back if no previous user
      if (currentStoryIndex > 0) {
        const prevStory = allStories[currentStoryIndex - 1];
        router.replace({
          pathname: '/discover/story',
          params: {
            storyData: JSON.stringify(prevStory),
            allStoriesData: JSON.stringify(allStories),
          },
        });
      } else {
        router.back();
      }
    }
  };

  const handlePressRight = () => {
    // If we're not at the last story of this user, go to next story of same user
    if (currentStoryIndexInUserStories < currentUserStories.length - 1) {
      const nextStory = currentUserStories[currentStoryIndexInUserStories + 1];
      router.replace({
        pathname: '/discover/story',
        params: {
          storyData: JSON.stringify(nextStory),
          allStoriesData: JSON.stringify(allStories),
        },
      });
    } else {
      // Go to next user's stories or back if no next user
      if (currentStoryIndex < allStories.length - 1) {
        const nextStory = allStories[currentStoryIndex + 1];
        router.replace({
          pathname: '/discover/story',
          params: {
            storyData: JSON.stringify(nextStory),
            allStoriesData: JSON.stringify(allStories),
          },
        });
      } else {
        router.back();
      }
    }
  };

  if (!story || !story.file) {
    return null;
  }

  const fileUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${story.file.storage_path}`;
  const duration = story.time_delay * 1000; // Convert to milliseconds

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <ImageBackground source={{ uri: fileUrl }} style={styles.imageBackground}>
        <View style={styles.header}>
          <View style={styles.progressBarsContainer}>
            {currentUserStories.map((userStory, index) => (
              <ProgressBar 
                key={userStory.id}
                duration={duration} 
                onFinish={handlePressRight}
                isActive={index === currentStoryIndexInUserStories}
                isCompleted={index < currentStoryIndexInUserStories}
              />
            ))}
          </View>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: story.user.avatar_url || 'https://via.placeholder.com/35' }} 
              style={styles.avatar} 
            />
            <Text style={styles.username}>{story.user.username || 'Unknown'}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <X size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.navigation}>
          <Pressable style={styles.navPressable} onPress={handlePressLeft} />
          <Pressable style={styles.navPressable} onPress={handlePressRight} />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 10,
    zIndex: 1,
  },
  progressBarsContainer: {
    flexDirection: 'row',
    gap: 4,
    height: 3,
    marginBottom: 10,
  },
  progressBarContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 20,
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  navPressable: {
    flex: 1,
  },
  closeButton: {
    marginLeft: 10,
  },
}); 