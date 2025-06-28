import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

interface AvatarProps {
  imageUrl: string | null | undefined;
  fullName: string | null | undefined;
  size?: number;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '';
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.substring(0, 2).toUpperCase();
}

export function Avatar({ imageUrl, fullName, size = 50 }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const showInitials = hasError || !imageUrl;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: themeColors.border,
        },
      ]}
    >
      {showInitials ? (
        <Text style={[styles.initials, { fontSize: size / 2.5 }]}>
          {getInitials(fullName)}
        </Text>
      ) : (
        <Image
          source={{ uri: imageUrl! }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setHasError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
}); 