import React from 'react';
import { Pressable, Text, StyleSheet, useColorScheme, ViewStyle, TextStyle } from 'react-native';
import Colors from '@/constants/Colors';

const buttonVariants = {
  default: {
    backgroundColor: Colors.light.tint,
    textColor: Colors.light.background,
    borderColor: undefined,
    borderWidth: undefined,
  },
  destructive: {
    backgroundColor: Colors.light.error,
    textColor: Colors.light.background,
    borderColor: undefined,
    borderWidth: undefined,
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: Colors.light.tint,
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  secondary: {
    backgroundColor: Colors.light.secondaryText,
    textColor: Colors.light.background,
    borderColor: undefined,
    borderWidth: undefined,
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: Colors.light.tint,
    borderColor: undefined,
    borderWidth: undefined,
  },
};

const buttonSizes = {
  default: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    fontSize: 16,
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    fontSize: 18,
  },
};

interface ButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  title,
  disabled,
  variant = 'default',
  size = 'default',
  style,
  textStyle,
}: ButtonProps) {
  const variantStyles = buttonVariants[variant];
  const sizeStyles = buttonSizes[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantStyles.textColor,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
}); 