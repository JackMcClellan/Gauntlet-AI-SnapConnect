import React from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

interface IconButtonProps {
  icon: React.ElementType;
  onPress: () => void;
}

export function IconButton({ icon: Icon, onPress }: IconButtonProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, { backgroundColor: pressed ? themeColors.background : themeColors.card }]}
    >
      <Icon size={20} color={themeColors.text} />
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