import React from 'react';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

export function Logo() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return <Text style={[styles.logo, { color: themeColors.tint }]}>SnapFix</Text>;
}

const styles = StyleSheet.create({
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
}); 