import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { AppleMaps, GoogleMaps } from 'expo-maps';

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Header title="Map" />
      {Platform.OS === 'ios' ? (
        <AppleMaps.View style={{ flex: 1 }} />
      ) : Platform.OS === 'android' ? (
        <GoogleMaps.View style={{ flex: 1 }} />
      ) : (
        <View style={styles.container}>
          <Text style={{ color: themeColors.text }}>
            Friend locations will appear here.
          </Text>
        </View>
      )}
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