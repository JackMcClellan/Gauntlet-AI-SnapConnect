import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ImageBackground, SafeAreaView, FlatList, TouchableOpacity, TextInput, Alert, Platform, GestureResponderEvent, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { X, Sparkles, Download, Send, ArrowLeft } from 'lucide-react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { CircleButton } from '@/components/CircleButton';
import { SendModal } from '@/components/SendModal';
import { sendSnap } from '@/lib/api';

const FILTERS = [
  { name: 'None', color: 'transparent' },
  { name: 'Sepia', color: 'rgba(112, 66, 20, 0.4)' },
  { name: 'Blues', color: 'rgba(0, 0, 255, 0.3)' },
  { name: 'Red', color: 'rgba(255, 0, 0, 0.3)' },
  { name: 'Mono', color: 'rgba(128, 128, 128, 0.5)' },
];

interface TextOverlay {
  id: number;
  text: string;
  position: { x: number; y: number };
  isEditing: boolean;
}

interface DraggableTextProps {
  item: TextOverlay;
  onUpdate: (id: number, text: string) => void;
  onFinishEditing: (id: number) => void;
  onDelete: (id: number) => void;
}

const DraggableText = React.memo(({ item, onUpdate, onFinishEditing, onDelete }: DraggableTextProps) => {
  const translateY = useSharedValue(item.position.y);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startY: number }>({
    onStart: (_, ctx) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateY.value = ctx.startY + event.translationY;
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.textContainer, animatedStyle]}>
        {item.isEditing ? (
          <TextInput
            style={styles.textInput}
            value={item.text}
            onChangeText={(text) => onUpdate(item.id, text)}
            onBlur={() => onFinishEditing(item.id)}
            autoFocus
            multiline
          />
        ) : (
          <TouchableOpacity onPress={() => onDelete(item.id)}>
            <Text style={styles.text}>{item.text}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
});

export default function ReviewScreen() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const nextId = useRef(0);
  const [isEffectsMenuVisible, setIsEffectsMenuVisible] = useState(false);
  const [isSendModalVisible, setIsSendModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);

  const finishEditing = useCallback((id: number) => {
    setTextOverlays(currentOverlays => {
      const overlay = currentOverlays.find(o => o.id === id);
      if (overlay && overlay.text.trim() === '') {
        return currentOverlays.filter(o => o.id !== id);
      }
      return currentOverlays.map(o =>
        o.id === id ? { ...o, isEditing: false } : o
      );
    });
  }, []);

  if (!photoUri) {
    return (
      <View style={styles.container}>
        <Text>No photo to display.</Text>
      </View>
    );
  }

  const handleSend = async (selections: { toStory: boolean; toPublic: boolean; toFriends: string[] }) => {
    if (!photoUri) {
      Alert.alert('Error', 'No photo to send.');
      return;
    }
    setIsSending(true);

    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) {
        throw new Error('Could not capture image.');
      }
      
      await sendSnap(uri, selections);

      Alert.alert('Success', 'Your photo has been sent!');
      router.replace('/(tabs)/messages');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error('Failed to send photo:', error);
        Alert.alert('Error', `There was a problem sending your photo: ${message}`);
    } finally {
        setIsSending(false);
    }
  };

  const handleTapToAddText = (event: GestureResponderEvent) => {
    if (isEffectsMenuVisible) {
        return;
    }
    
    const currentlyEditing = textOverlays.find(o => o.isEditing);

    if (currentlyEditing) {
      finishEditing(currentlyEditing.id);
    } else {
      const { locationY } = event.nativeEvent;
      const newText: TextOverlay = {
        id: nextId.current++,
        text: '',
        position: { x: 0, y: locationY - 20 },
        isEditing: true,
      };
      setTextOverlays(currentOverlays => [...currentOverlays, newText]);
    }
  };

  const updateText = useCallback((id: number, text: string) => {
    setTextOverlays(overlays => overlays.map(o => o.id === id ? { ...o, text } : o));
  }, []);

  const deleteText = useCallback((id: number) => {
    Alert.alert("Delete Text", "Are you sure you want to delete this text?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => setTextOverlays(overlays => overlays.filter(o => o.id !== id)), style: "destructive" }
    ]);
  }, []);
  
  const renderFilter = ({ item }: { item: typeof FILTERS[0] }) => (
    <TouchableOpacity style={styles.filterItem} onPress={() => setSelectedFilter(item)}>
      <Text style={styles.filterName}>{item.name}</Text>
      <View style={[styles.filterPreview, { backgroundColor: item.color === 'transparent' ? 'white' : item.color }]} />
    </TouchableOpacity>
  );

  const onSaveImageAsync = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please grant permission to save photos in your settings.'
        );
        return;
      }

      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture?.();
        if (uri) {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Saved!', 'The image has been saved to your photos.');
        } else {
          Alert.alert('Error', 'Could not capture image. Please try again.');
        }
      }
    } catch (e) {
      console.error('Failed to save image:', e);
      Alert.alert('Error', 'An unexpected error occurred while saving the image.');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ViewShot ref={viewShotRef} options={{ fileName: "snapconnect-edit", format: "jpg", quality: 0.9 }} style={{flex: 1}}>
          <ImageBackground source={{ uri: photoUri }} style={styles.photo}>
            <TouchableOpacity activeOpacity={1} onPress={handleTapToAddText} style={StyleSheet.absoluteFill}>
              <View style={[styles.filterOverlay, { backgroundColor: selectedFilter.color }]} />
              {textOverlays.map(item => <DraggableText key={item.id} item={item} onUpdate={updateText} onFinishEditing={finishEditing} onDelete={deleteText} />)}
            </TouchableOpacity>
          </ImageBackground>
        </ViewShot>

        <View style={[styles.topControls, { top: insets.top + 10 }]}>
            <CircleButton onPress={() => router.back()}>
                <ArrowLeft size={28} color="white" />
            </CircleButton>
            <CircleButton onPress={() => setIsEffectsMenuVisible(true)}>
                <Sparkles size={28} color="white" />
            </CircleButton>
        </View>

        {isEffectsMenuVisible && (
          <View style={styles.effectsMenu}>
            <TouchableOpacity style={[styles.effectsMenuCloseButton, {top: insets.top + 10}]} onPress={() => setIsEffectsMenuVisible(false)}>
                <X size={24} color="white" />
            </TouchableOpacity>
            <Text style={[styles.effectsMenuTitle, {marginTop: insets.top + 40}]}>Filters</Text>
            {FILTERS.map(filter => (
              <TouchableOpacity key={filter.name} style={styles.filterItem} onPress={() => {
                setSelectedFilter(filter);
                setIsEffectsMenuVisible(false);
              }}>
                <Text style={styles.filterName}>{filter.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity style={styles.bottomButton} onPress={onSaveImageAsync}>
                <Download size={24} color="white" />
                <Text style={styles.bottomButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomButton} onPress={() => setIsSendModalVisible(true)}>
                <Send size={24} color="white" />
                <Text style={styles.bottomButtonText}>Send</Text>
            </TouchableOpacity>
        </View>

        <SendModal
            isVisible={isSendModalVisible}
            onClose={() => setIsSendModalVisible(false)}
            onSend={handleSend}
        />

        {isSending && (
            <View style={styles.sendingOverlay}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{ color: 'white', marginTop: 10 }}>Sending...</Text>
            </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  photo: {
    flex: 1,
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textContainer: {
    position: 'absolute',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  textInput: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  effectsMenu: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 240,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 10,
    zIndex: 2,
  },
  effectsMenuCloseButton: {
      position: 'absolute',
      right: 20,
  },
  effectsMenuTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterItem: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  filterName: {
    color: 'white',
    fontSize: 16,
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  sendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  }
}); 