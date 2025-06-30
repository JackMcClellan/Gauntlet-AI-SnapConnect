import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, useColorScheme, Alert, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { DUMMY_INTERESTS } from '@/constants/DummyData';
import * as ImagePicker from 'expo-image-picker';
import { useSession } from '@/providers/auth';
import { uploadFileFromUri, updateUser } from '@/lib/api';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { profileAtom } from '@/store/auth';

function InterestPill({ interest, onToggle, isSelected }: { interest: string, onToggle: (interest: string) => void, isSelected: boolean }) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  
  return (
    <Pressable 
      style={[styles.pill, isSelected ? { backgroundColor: themeColors.primary } : { backgroundColor: themeColors.border }]}
      onPress={() => onToggle(interest)}
    >
      <Text style={{ color: isSelected ? themeColors.card : themeColors.text }}>{interest}</Text>
    </Pressable>
  )
}

export default function OnboardScreen() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const { session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useAtom(profileAtom);
  
  const [username, setUsername] = useState(profile?.username || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!username.trim()) {
      Alert.alert('Username required', 'Please enter a username to continue.');
      return;
    }
    if (!session || !profile) return;
    setIsSubmitting(true);

    try {
      let file_id: string | undefined = profile?.file_id || undefined;

      if (localAvatarUri) {
        try {
          const file = await uploadFileFromUri(localAvatarUri);
          file_id = file.id;
        } catch (error) {
          if (error instanceof Error) {
            Alert.alert('Upload Error', `Failed to upload image: ${error.message}`);
          }
          return;
        }
      }

      const updatedUser = await updateUser(session.user.id, {
        username,
        file_id: file_id || undefined,
        interests: selectedInterests || [],
      });
      
      // Merge the updated fields with the existing profile
      const updatedProfile = { ...profile, ...updatedUser };
      setProfile(updatedProfile); 

      Alert.alert('Profile Updated!', 'Your profile has been successfully updated.');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Stack.Screen options={{ title: 'Set Up Your Profile', headerBackVisible: false }} />
      <View style={styles.content}>
        <Pressable onPress={handlePickImage} style={styles.avatarContainer}>
          <Avatar
            imageUrl={localAvatarUri || profile?.avatar_url}
            fullName={username}
            size={120}
          />
          <Text style={[styles.avatarText, { color: themeColors.primary }]}>Add a photo</Text>
        </Pressable>

        <TextInput
          style={[styles.input, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.card }]}
          placeholder="Username"
          placeholderTextColor={themeColors.text}
          value={username}
          onChangeText={setUsername}
        />
        
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>What are your interests?</Text>
        <Text style={[styles.sectionDescription, { color: themeColors.text }]}>
          Select topics you're passionate about. This helps us personalize your experience and connect you with like-minded people.
        </Text>
        <View style={styles.pillsContainer}>
          {DUMMY_INTERESTS.map(interest => (
            <InterestPill 
              key={interest} 
              interest={interest}
              onToggle={handleToggleInterest}
              isSelected={selectedInterests.includes(interest)}
            />
          ))}
        </View>

        <Button 
          title="Complete Profile" 
          onPress={handleComplete} 
          style={{ marginTop: 20 }}
          disabled={isSubmitting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarText: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
}); 