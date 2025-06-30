import { StyleSheet, useColorScheme, FlatList, TouchableOpacity, Image, useWindowDimensions, TextInput, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useRef, useState, useEffect } from 'react';
import { getStories, getPosts } from '@/lib/api';
import { Story, ContentResult } from '@/types/supabase';
import { Play, Search, X } from 'lucide-react-native';
import { useRAGSearch } from '@/hooks/use-rag-search';

const DiscoverItem = ({
  item,
  onPress,
  width,
}: {
  item: {
    id: string;
    type: string;
    url: string;
    userId: string;
    caption?: string | null;
    user?: {
      id: string;
      username: string;
      avatar: string;
    };
  };
  onPress: (item: any) => void;
  width: number;
}) => {
  const video = useRef<Video>(null);

  return (
    <TouchableOpacity
      style={[styles.discoverItem, { width: width, height: width * 1.5 }]}
      onPress={() => onPress(item)}>
      {item.type === 'image' ? (
        <Image source={{ uri: item.url }} style={styles.discoverMedia} />
      ) : (
        <Video
          ref={video}
          style={styles.discoverMedia}
          source={{
            uri: item.url,
          }}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted
          shouldPlay
        />
      )}
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Play size={32} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function DiscoverScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();

  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    searchContent, 
    isLoading: isSearching, 
    results: searchResults, 
    clearResults 
  } = useRAGSearch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storiesData, postsData] = await Promise.all([
          getStories().catch(err => {
            console.error('Stories API error:', err);
            return [];
          }),
          getPosts().catch(err => {
            console.error('Posts API error:', err);
            return [];
          })
        ]);
        setStories(storiesData);
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching discover data:', error);
        // Set empty arrays as fallback
        setStories([]);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      clearResults();
      return;
    }

    await searchContent(searchQuery, {
      search_type: 'hybrid',
      max_results: 20,
      generate_response: false // We just want the matching content
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearResults();
  };

  // Transform API stories to match the story reel format
  const usersWithStories = stories.map(story => ({
    id: story.user_id,
    name: story.user.username || 'Unknown',
    avatar: story.user.avatar_url || 'https://via.placeholder.com/60',
    lastMessage: 'Posted a story',
    timestamp: new Date(story.created_at).toLocaleDateString(),
    unreadCount: 0,
  })).filter((user, index, self) => 
    index === self.findIndex(u => u.id === user.id)
  );

  // Transform search results to match post format
  const transformSearchResults = (results: ContentResult[]) => {
    return results.map(result => ({
      id: result.id,
      type: (result.file_type as 'image' | 'video'),
      url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${result.storage_path}`,
      userId: result.user_id,
      caption: result.user_context || result.caption || null,
      user: {
        id: result.user_id,
        username: result.username || 'Unknown',
        avatar: result.avatar_url || 'https://via.placeholder.com/60',
      }
    }));
  };

  // Transform API posts for display
  const allPosts = posts.map(post => ({
    id: post.id,
    type: post.file.file_type,
    url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${post.file.storage_path}`,
    userId: post.user_id,
    caption: post.caption,
    user: {
      id: post.user_id,
      username: post.user.username || 'Unknown',
      avatar: post.user.avatar_url || 'https://via.placeholder.com/60',
    }
  }));

  // Determine what content to display
  const hasActiveSearch = searchQuery.trim().length > 0;
  const discoverContent = hasActiveSearch ? transformSearchResults(searchResults) : allPosts;

  const onStoryPress = (userId: string) => {
    const apiStory = stories.find(story => story.user_id === userId);
    
    if (apiStory) {
      // Navigate to story viewer
      router.push({
        pathname: '/discover/story',
        params: { 
          storyData: JSON.stringify(apiStory),
          allStoriesData: JSON.stringify(stories),
        },
      });
    }
  };

  const onContentPress = (item: any) => {
    router.push({
      pathname: '/discover/content',
      params: { 
        postId: item.id,
      },
    });
  };

  const renderStoryReelItem = ({ item }: { item: typeof usersWithStories[0] }) => (
    <TouchableOpacity style={styles.storyReelItem} onPress={() => onStoryPress(item.id)}>
      <View style={styles.storyAvatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const itemWidth = (width - 30) / 2; // 10 padding on each side, 10 for middle space

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Header title="Discover" />
      <View style={styles.container}>
        <View style={styles.storyReelContainer}>
          <FlatList
            data={usersWithStories}
            renderItem={renderStoryReelItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { borderBottomColor: themeColors.border }]}>
          <View style={[styles.searchInputContainer, { 
            backgroundColor: themeColors.background, 
            borderColor: themeColors.border 
          }]}>
            <Search size={20} color={themeColors.text + '80'} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search your content..."
              placeholderTextColor={themeColors.text + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <X size={20} color={themeColors.text + '80'} />
              </TouchableOpacity>
            )}
          </View>
          {isSearching && (
            <ActivityIndicator 
              size="small" 
              color={themeColors.primary} 
              style={styles.searchLoader} 
            />
          )}
        </View>

        {/* Search Results Info */}
        {hasActiveSearch && (
          <View style={[styles.searchResultsInfo, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.searchResultsText, { color: themeColors.text + '80' }]}>
              {isSearching 
                ? 'Searching...' 
                : `Found ${discoverContent.length} result${discoverContent.length !== 1 ? 's' : ''} for "${searchQuery}"`
              }
            </Text>
          </View>
        )}

        <FlatList
          data={discoverContent}
          renderItem={({ item }) => <DiscoverItem item={item} onPress={onContentPress} width={itemWidth} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.mainContent}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          ListEmptyComponent={
            hasActiveSearch && !isSearching ? (
              <View style={styles.emptySearchContainer}>
                <Text style={[styles.emptySearchText, { color: themeColors.text + '60' }]}>
                  No content found for "{searchQuery}"
                </Text>
                <Text style={[styles.emptySearchSubtext, { color: themeColors.text + '40' }]}>
                  Try a different search term or browse all content
                </Text>
              </View>
            ) : null
          }
        />
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
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchLoader: {
    marginLeft: 12,
  },
  searchResultsInfo: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySearchSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  mainContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  discoverItem: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: Colors.light.border,
  },
  discoverMedia: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
}); 