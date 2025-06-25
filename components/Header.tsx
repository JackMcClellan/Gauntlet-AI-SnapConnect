import React from 'react';
import { View, Text, StyleSheet, useColorScheme, SafeAreaView, Pressable, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { IconButton } from './IconButton';

interface HeaderProps {
  title?: string;
  right?: React.ReactNode;
}

export function Header({ title, right }: HeaderProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={{ backgroundColor: themeColors.card }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.headerContainer, { borderBottomColor: themeColors.background }]}>
        <View style={styles.sideContainer}>
          <Pressable onPress={() => router.push('/profile')} style={[styles.avatarButton, {backgroundColor: themeColors.background}]}>
            <Image
              source={{ uri: 'https://placekitten.com/g/50/50' }} // Placeholder
              style={styles.avatar}
            />
          </Pressable>
          <IconButton name="search" onPress={() => { /* TODO: Search Dropdown */ }} />
        </View>

        {title && <Text style={[styles.headerTitle, { color: themeColors.text }]}>{title}</Text>}

        <View style={styles.sideContainer}>
          {right || (
            <>
              <IconButton name="user-plus" onPress={() => { /* TODO: Add Friend */ }} />
              <IconButton name="ellipsis-h" onPress={() => { /* TODO: Settings */ }} />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 10,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  sideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    position: 'absolute',
    left: '45%', // Adjust for centering
    textAlign: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
}); 