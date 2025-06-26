import { StyleSheet, useColorScheme, FlatList } from 'react-native';
import { View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { DUMMY_CHATS } from '@/constants/DummyData';
import { MessageCard } from '@/components/MessageCard';

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Header title="Chat" />
      <FlatList
        data={DUMMY_CHATS}
        renderItem={({ item }) => <MessageCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ backgroundColor: themeColors.background }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 