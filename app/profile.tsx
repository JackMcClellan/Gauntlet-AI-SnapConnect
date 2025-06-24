import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import Colors from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/providers/auth';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { signOut } = useSession();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>Profile / Settings</Text>
      <View style={styles.buttonContainer}>
        <Button title="Sign Out" onPress={signOut} variant="destructive" />
      </View>
      <Button title="Close" onPress={() => router.back()} variant="ghost" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
}); 