import { StyleSheet, useColorScheme, FlatList, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { DUMMY_CHATS, DUMMY_STORIES, DUMMY_DISCOVER_CONTENT } from '@/constants/DummyData';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useRef } from 'react';
import { Play } from 'lucide-react-native';

const DiscoverItem = ({
  item,
  onPress,
  width,
}: {
  item: (typeof DUMMY_DISCOVER_CONTENT)[0];
  onPress: (item: (typeof DUMMY_DISCOVER_CONTENT)[0]) => void;
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

  const usersWithStories = DUMMY_CHATS.filter(
    (chat) => DUMMY_STORIES[chat.id as keyof typeof DUMMY_STORIES]
  );

  const onStoryPress = (chatId: string) => {
    const userIds = usersWithStories.map((user) => user.id);
    router.push({
      pathname: '/discover/[id]',
      params: { id: chatId, userIds: JSON.stringify(userIds) },
    });
  };

  const onContentPress = (item: (typeof DUMMY_DISCOVER_CONTENT)[0]) => {
    router.push({
      pathname: '/discover/content',
      params: { id: item.id },
    });
  };

  const renderStoryReelItem = ({ item }: { item: (typeof DUMMY_CHATS)[0] }) => (
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
        <FlatList
          data={DUMMY_DISCOVER_CONTENT}
          renderItem={({ item }) => <DiscoverItem item={item} onPress={onContentPress} width={itemWidth} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.mainContent}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
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