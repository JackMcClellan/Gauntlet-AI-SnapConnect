import { View, Text, StyleSheet, useColorScheme, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import Colors from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/providers/auth';
import { useApiQuery, useApiMutation } from '@/hooks/use-api';
import { getUser, updateUser, uploadFileFromUri } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { signOut, session } = useSession();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useApiQuery({
    queryKey: ['user', session?.user?.id],
    queryFn: () => getUser(session!.user!.id),
    enabled: !!session?.user?.id,
  });

  const { mutate: doUpdateUser, isPending: isUpdatingUser } = useApiMutation({
    mutationFn: (vars: { username: string, avatarUrl?: string }) => updateUser(session!.user!.id, vars),
    onSuccess: () => {
      Alert.alert('Success', 'Profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['user', session?.user?.id] });
    },
    onError: (error) => {
      Alert.alert('Error', `Failed to update profile: ${error.message}`);
    }
  });

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      try {
        const file = await uploadFileFromUri(uri);
        setAvatarUrl(file.storage_path); // Or however the URL is constructed
        doUpdateUser({ username, avatarUrl: file.storage_path });
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert('Upload Error', `Failed to upload image: ${error.message}`);
        }
      }
    }
  }

  function handleSave() {
    if (!username) {
      Alert.alert('Username required', 'Please enter a username.');
      return;
    }
    doUpdateUser({ username, avatarUrl });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Avatar
        imageUrl={avatarUrl}
        fullName={username}
        size={120}
      />
      <Button title="Change Photo" onPress={handlePickImage} variant="ghost" />
      <TextInput
        style={[styles.input, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.card }]}
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor={themeColors.text}
        autoCapitalize="none"
      />
      <View style={styles.buttonContainer}>
        <Button
          title={isUpdatingUser ? "Saving..." : "Save Profile"}
          onPress={handleSave}
          disabled={isUpdatingUser || isLoadingUser}
        />
        <Button title="Sign Out" onPress={signOut} variant="destructive" />
      </View>
      <Button title="Close" onPress={() => router.back()} variant="ghost" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginVertical: 10,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
    gap: 10,
  },
}); 