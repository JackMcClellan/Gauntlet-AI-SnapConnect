import React from 'react';
import { Tabs } from 'expo-router';
import { Map, MessageCircle, Camera, Book, Compass } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Map size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MessageCircle size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <Camera size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <Compass size={28} color={color} />,
        }}
      />
    </Tabs>
  );
} 