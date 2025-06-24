import React from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface IconButtonProps {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  onPress: () => void;
}

export function IconButton({ name, onPress }: IconButtonProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, { backgroundColor: pressed ? '#555' : '#333' }]}
    >
      <FontAwesome name={name} size={20} color={themeColors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
}); 