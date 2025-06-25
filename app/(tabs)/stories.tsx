import { StyleSheet, useColorScheme, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { getStories, Story } from '@/lib/api';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

type GroupedStory = {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  stories: Story[];
};

export default function StoriesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const [stories, setStories] = useState<GroupedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setIsLoading(true);
        const stories = await getStories();

        // Group stories by user
        const grouped = stories.reduce((acc, story) => {
          const userId = story.user.id;
          if (!acc[userId]) {
            acc[userId] = {
              userId: userId,
              username: story.user.username,
              avatarUrl: story.user.avatar_url,
              stories: [],
            };
          }
          acc[userId].stories.push(story);
          return acc;
        }, {} as Record<string, GroupedStory>);

        setStories(Object.values(grouped));
      } catch (error) {
        console.error('Failed to fetch stories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  const onStoryPress = (group: GroupedStory) => {
    // Navigate to the first story of that user
    // The story player will need to handle fetching all stories for this user
    router.push(`/story/${group.stories[0].id}`);
  };

  const renderStoryReelItem = ({ item }: { item: GroupedStory }) => (
    <TouchableOpacity style={styles.storyReelItem} onPress={() => onStoryPress(item)}>
      <View style={styles.storyAvatarContainer}>
        <Image
          source={{ uri: item.avatarUrl || 'https://placekitten.com/60/60' }}
          style={styles.storyAvatar}
        />
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.username || 'Anonymous'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Header title="Stories" />
      <View style={styles.container}>
        <View style={styles.storyReelContainer}>
          {isLoading ? (
            <Text style={{ padding: 10, color: themeColors.text }}>Loading stories...</Text>
          ) : (
            <FlatList
              data={stories}
              renderItem={renderStoryReelItem}
              keyExtractor={(item) => item.userId}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ color: themeColors.text }}>No stories yet.</Text>
                </View>
              }
            />
          )}
        </View>
        <View style={styles.mainContent}>
          <Text style={{ color: themeColors.text }}>Friend and community stories will appear here.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  storyReelContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  storyReelItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyAvatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  storyUsername: {
    marginTop: 5,
    fontSize: 12,
    maxWidth: 70,
  },
  emptyContainer: {
    paddingHorizontal: 20,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 