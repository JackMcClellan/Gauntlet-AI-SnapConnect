import { StyleSheet, useColorScheme, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { DUMMY_CHATS, DUMMY_STORIES } from '@/constants/DummyData';
import { useRouter } from 'expo-router';

export default function StoriesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const usersWithStories = DUMMY_CHATS.filter(
    (chat) => DUMMY_STORIES[chat.id as keyof typeof DUMMY_STORIES]
  );

  const onStoryPress = (chatId: string) => {
    const userIds = usersWithStories.map((user) => user.id);
    router.push({
      pathname: '/story/[id]',
      params: { id: chatId, userIds: JSON.stringify(userIds) },
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

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Header title="Stories" />
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
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 