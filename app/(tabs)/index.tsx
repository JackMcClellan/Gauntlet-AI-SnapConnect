import { StyleSheet, View } from 'react-native';
import { CoreCamera } from '@/components/camera/CoreCamera';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <CoreCamera />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 