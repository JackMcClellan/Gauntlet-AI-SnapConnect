import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from '@/components/Button';
import { Zap, ZapOff, RotateCw } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CircleButton } from '../CircleButton';

export function CoreCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'on' | 'off' | 'auto'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const longPressTimer = useRef<number | null>(null);
  const router = useRouter();

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function toggleFlash() {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  }

  async function takePicture() {
    if (cameraRef.current && !isRecording) {
      const photo = await cameraRef.current.takePictureAsync();
      router.push({
        pathname: '/review',
        params: { photoUri: photo.uri },
      });
    }
  }

  const handlePressIn = () => {
    longPressTimer.current = setTimeout(() => {
      setIsRecording(true);
      scale.value = withTiming(1.5, { duration: 200 });
      rotation.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
      if (cameraRef.current) {
        cameraRef.current.recordAsync().then((video) => {
          console.log('Video recorded:', video);
          // TODO: Handle the recorded video
        }).catch(error => {
          console.error("Video recording failed: ", error);
        });
      }
      longPressTimer.current = null;
    }, 250);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      takePicture();
    } else if (isRecording) {
      if (cameraRef.current) {
        cameraRef.current.stopRecording();
      }
      setIsRecording(false);
      scale.value = withTiming(1, { duration: 200 });
      rotation.value = withTiming(0);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value * 360}deg` },
    ],
  }));

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={[styles.container, {padding: 10}]}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} flash={flash} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <CircleButton onPress={toggleFlash}>
            {flash === 'on' ? <Zap size={24} stroke="white" /> : <ZapOff size={24} stroke="white" />}
          </CircleButton>
          
          <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={[styles.captureButton, animatedStyle]}>
              <View style={styles.captureButtonInner} />
            </Animated.View>
          </TouchableOpacity>

          <CircleButton onPress={toggleCameraFacing}>
            <RotateCw size={24} stroke="white" />
          </CircleButton>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 30,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    borderWidth: 5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
}); 