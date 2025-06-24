import { View, Text, TextInput, StyleSheet, Alert, useColorScheme, Pressable } from 'react-native';
import React, { useState } from 'react';
import Colors from '@/constants/Colors';
import { useSession } from '@/providers/auth';
import { router } from 'expo-router';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { signIn } = useSession();

  const handleSignIn = async () => {
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Logo />
      <TextInput
        style={[styles.input, { borderColor: themeColors.tabIconDefault, color: themeColors.text, backgroundColor: themeColors.card }]}
        placeholder="Email"
        placeholderTextColor={themeColors.tabIconDefault}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={[styles.input, { borderColor: themeColors.tabIconDefault, color: themeColors.text, backgroundColor: themeColors.card }]}
        placeholder="Password"
        placeholderTextColor={themeColors.tabIconDefault}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <View style={styles.buttonContainer}>
        <Button title={loading ? 'Loading...' : 'Login'} onPress={handleSignIn} disabled={loading} />
      </View>
      <Pressable onPress={() => router.replace('/(auth)/sign-up')}>
        <Text style={[styles.link, { color: themeColors.tint }]}>Don't have an account? Sign Up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 12,
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
}); 