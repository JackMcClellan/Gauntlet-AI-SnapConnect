import { StyleSheet, useColorScheme, FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { MessageCard } from '@/components/MessageCard';
import { getConversations } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api';

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const { data: conversations, isLoading, isError, error, refetch } = useApiQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  // Show a full-screen loader on initial load
  if (isLoading && !conversations) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  // Show a full-screen error message if initial fetch fails
  if (isError && !conversations) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: themeColors.error }}>
          Error: {error instanceof Error ? error.message : 'An unknown error occurred'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Header title="Chat" />
      <FlatList
        data={conversations || []}
        renderItem={({ item }) => <MessageCard item={item} />}
        keyExtractor={(item) => item.other_user_id}
        contentContainerStyle={{ backgroundColor: themeColors.background }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 