import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ImageBackground, TouchableOpacity, Text, SafeAreaView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { DUMMY_CHATS, DUMMY_STORIES } from '@/constants/DummyData';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

function ProgressBar({ duration, onFinish }: { duration: number; onFinish: () => void }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: Easing.linear }, (isFinished) => {
      if (isFinished) {
        runOnJS(onFinish)();
      }
    });
  }, [duration]);

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
  const { id, userIds: userIdsString, initialStoryIndex } = useLocalSearchParams<{ id: string; userIds: string, initialStoryIndex?: string }>();
  const userIds = JSON.parse(userIdsString || '[]');

  const userStories = DUMMY_STORIES[id as keyof typeof DUMMY_STORIES] || [];
  const user = DUMMY_CHATS.find((c) => c.id === id);

  const [storyIndex, setStoryIndex] = useState(Number(initialStoryIndex) || 0);

  useEffect(() => {
    if (!userStories.length) {
      router.back();
    }
  }, [userStories]);

  const handlePressLeft = () => {
    if (storyIndex === 0) {
      const currentUserIndex = userIds.indexOf(id);
      if (currentUserIndex > 0) {
        const prevUserId = userIds[currentUserIndex - 1];
        const prevUserStories = DUMMY_STORIES[prevUserId as keyof typeof DUMMY_STORIES] || [];
        router.replace({
          pathname: '/story/[id]',
          params: {
            id: prevUserId,
            userIds: userIdsString,
            initialStoryIndex: String(prevUserStories.length - 1),
          },
        });
      }
    } else {
      setStoryIndex((prev) => prev - 1);
    }
  };

  const handlePressRight = () => {
    if (storyIndex === userStories.length - 1) {
      const currentUserIndex = userIds.indexOf(id);
      if (currentUserIndex < userIds.length - 1) {
        const nextUserId = userIds[currentUserIndex + 1];
        router.replace({
          pathname: '/story/[id]',
          params: { id: nextUserId, userIds: userIdsString },
        });
      } else {
        router.back();
      }
    } else {
      setStoryIndex((prev) => prev + 1);
    }
  };

  if (!user || !userStories.length) {
    return null;
  }
  
  const currentStory = userStories[storyIndex];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground source={{ uri: currentStory.url }} style={styles.imageBackground}>
        <View style={styles.header}>
            <View style={styles.progressBarsContainer}>
                {userStories.map((story, index) => {
                    const isViewed = index < storyIndex;
                    const isActive = index === storyIndex;
                    return (
                        <View key={story.id} style={styles.progressBarContainer}>
                            {isActive ? (
                                <ProgressBar duration={story.duration} onFinish={handlePressRight} />
                            ) : (
                                <View style={[styles.progressBar, { width: isViewed ? '100%' : '0%' }]} />
                            )}
                        </View>
                    );
                })}
            </View>
            <View style={styles.userInfo}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <Text style={styles.username}>{user.name}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color="white" style={{ marginLeft: 10}}/>
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
    }
}); 