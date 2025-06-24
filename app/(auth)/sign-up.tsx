import { View, TextInput, StyleSheet, Alert, useColorScheme, Text, Pressable } from 'react-native';
import React, { useState } from 'react';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { Logo } from '@/components/Logo';
import { useSession } from '@/providers/auth';
import { Button } from '@/components/Button';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { signUp } = useSession();

  async function handleSignUp() {
    setLoading(true);
    await signUp(email, password);
    setLoading(false);
    router.replace('/(auth)/login');
  }

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
        <Button title={loading ? 'Creating Account...' : 'Sign Up'} onPress={handleSignUp} disabled={loading} />
      </View>
      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <Text style={[styles.link, { color: themeColors.tint }]}>Already have an account? Sign In</Text>
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