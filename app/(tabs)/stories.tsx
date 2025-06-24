import { StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';

export default function StoriesScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Header title="Stories" />
      <View style={styles.container}>
        <Text style={{ color: themeColors.text }}>Friend and community stories will appear here.</Text>
      </View>
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