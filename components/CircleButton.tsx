import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

interface CircleButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CircleButton({ onPress, children, style }: CircleButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 50, // High value to ensure a circle
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 