import React, { useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Alert, Keyboard } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApiQuery } from '@/hooks/use-api';
import { getFriends } from '@/lib/api';
import { Friend } from '@/types/supabase';
import { Avatar } from './Avatar';
import { useAiCaption } from '@/hooks/use-ai-caption';

interface SendModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSend: (selections: { toStory: boolean; toPublic: boolean; toFriends: string[]; caption?: string; userContext?: string }) => void;
}

export function SendModal({ isVisible, onClose, onSend }: SendModalProps) {
  const [sendToStory, setSendToStory] = useState(false);
  const [sendToPublic, setSendToPublic] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [happeningText, setHappeningText] = useState('');
  const [publicCaption, setPublicCaption] = useState('');
  const [captionStyle, setCaptionStyle] = useState<'casual' | 'professional' | 'funny' | 'inspirational'>('casual');
  
  const { generateCaption, isLoading: aiLoading, error: aiError } = useAiCaption();
  const { data: friends, isLoading } = useApiQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
  });

  const acceptedFriends = useMemo(() => {
    if (!friends) return [];
    return friends.filter(f => f.status === 'accepted' && f.other_user);
  }, [friends]);

  const allFriendIds = useMemo(() => acceptedFriends.map(friend => friend.other_user.id), [acceptedFriends]);

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const isSendDisabled = !sendToStory && !sendToPublic && selectedFriends.length === 0 || 
                        (sendToPublic && !publicCaption.trim());

  const handleSelectFriend = (id: string) => {
    setSelectedFriends(prev =>
      prev.includes(id) ? prev.filter(friendId => friendId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedFriends.length === allFriendIds.length) {
      setSelectedFriends([]);
    } else {
      setSelectedFriends(allFriendIds);
    }
  };

  const handleGenerateAiCaption = async () => {
    const context = happeningText.trim();
    
    if (!context) {
      Alert.alert('Context Required', 'Please describe what\'s happening in your photo to generate a caption.');
      return;
    }

    try {
      console.log('Generating AI caption from context:', context);
      const result = await generateCaption({
        context: context,
        style: captionStyle,
        max_length: 150,
      });

      if (result && result.caption) {
        console.log('AI caption generated successfully:', result.caption);
        setPublicCaption(result.caption);
      } else {
        Alert.alert('Error', 'AI service did not return a caption. Please try again.');
      }
    } catch (err) {
      console.error('AI caption service failed:', err);
      Alert.alert('Error', 'Failed to generate AI caption. Please try again.');
    }
  };

  const handleSend = () => {
    // Validation for public posts
    if (sendToPublic && !publicCaption.trim()) {
      Alert.alert('Missing Caption', 'Please add a caption for your public post.');
      return;
    }

    // For public posts, use the generated/edited caption
    // For non-public posts, use happeningText as caption
    const captionToUse = sendToPublic ? publicCaption : happeningText;
    
    const toStoryWithPublic = sendToStory || sendToPublic;
    onSend({ 
      toStory: toStoryWithPublic, 
      toPublic: sendToPublic, 
      toFriends: selectedFriends,
      caption: captionToUse,
      userContext: happeningText.trim() || undefined
    });
    handleClose();
  };

  const handleClose = () => {
    // Reset all state when closing
    setSendToStory(false);
    setSendToPublic(false);
    setSelectedFriends([]);
    setHappeningText('');
    setPublicCaption('');
    setCaptionStyle('casual');
    onClose();
  };
  
  const renderFriendItem = ({ item }: { item: Friend }) => {
    const friendProfile = item.other_user;
    if (!friendProfile) return null;
    
    return (
      <TouchableOpacity style={styles.friendItem} onPress={() => handleSelectFriend(friendProfile.id)}>
        <View style={styles.friendInfo}>
          <Avatar imageUrl={friendProfile.avatar_url} fullName={friendProfile.username} size={40} />
          <Text style={[styles.friendName, { color: themeColors.text }]}>{friendProfile.username}</Text>
        </View>
        {selectedFriends.includes(friendProfile.id) ? (
          <CheckCircle size={24} color={themeColors.primary} />
        ) : (
          <Circle size={24} color={themeColors.border} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Send To...</Text>
        </View>

        {/* What's happening input */}
        <View style={styles.happeningSection}>
          <Text style={[styles.happeningLabel, { color: themeColors.text }]}>What's happening?</Text>
          <TextInput
            style={[styles.happeningInput, { 
              borderColor: themeColors.border, 
              backgroundColor: themeColors.background,
              color: themeColors.text 
            }]}
            placeholder="Describe what's in your photo..."
            placeholderTextColor={themeColors.text + '80'}
            value={happeningText}
            onChangeText={setHappeningText}
            onSubmitEditing={Keyboard.dismiss}
            blurOnSubmit={true}
            multiline
            numberOfLines={2}
            maxLength={200}
          />
          <View style={styles.inputFooter}>
            <Text style={[styles.helpText, { color: themeColors.text + '80' }]}>
              💡 This helps generate captions for public posts • Used directly for stories/messages
            </Text>
            <Text style={[styles.characterCount, { color: themeColors.text + '60' }]}>
              {happeningText.length}/200
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.storyItem} onPress={() => setSendToStory(!sendToStory)}>
            <Text style={[styles.storyText, { color: themeColors.text }]}>My Story</Text>
            {sendToStory ? <CheckCircle size={24} color={themeColors.primary} /> : <Circle size={24} color={themeColors.border} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.storyItem} onPress={() => {
          const newPublicState = !sendToPublic;
          setSendToPublic(newPublicState);
          // If enabling public, also enable story since public stories are still stories
          if (newPublicState) {
            setSendToStory(true);
          } else {
            // Reset caption when disabling public
            setPublicCaption('');
          }
        }}>
            <Text style={[styles.storyText, { color: themeColors.text }]}>Public View</Text>
            {sendToPublic ? <CheckCircle size={24} color={themeColors.primary} /> : <Circle size={24} color={themeColors.border} />}
        </TouchableOpacity>

        {/* Public Caption Section */}
        {sendToPublic && (
          <View style={[styles.captionSection, { borderTopColor: themeColors.border }]}>
            <View style={styles.captionHeader}>
              <Text style={[styles.captionLabel, { color: themeColors.text }]}>Caption</Text>
              <View style={styles.aiControls}>
                <View style={styles.styleSelector}>
                  {['casual', 'funny', 'professional', 'inspirational'].map((style) => (
                    <TouchableOpacity
                      key={style}
                      style={[
                        styles.styleButton,
                        {
                          backgroundColor: captionStyle === style ? themeColors.primary : themeColors.background,
                          borderColor: captionStyle === style ? themeColors.primary : themeColors.border,
                        }
                      ]}
                      onPress={() => setCaptionStyle(style as any)}
                    >
                      <Text style={[
                        styles.styleButtonText,
                        { color: captionStyle === style ? 'white' : themeColors.text }
                      ]}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.aiGenerateButton, { 
                    backgroundColor: themeColors.primary,
                    opacity: aiLoading ? 0.6 : 1 
                  }]}
                  onPress={handleGenerateAiCaption}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="sparkles" size={16} color="white" />
                  )}
                  <Text style={styles.aiGenerateButtonText}>
                    {aiLoading ? 'Generating...' : 'AI Generate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TextInput
              style={[styles.captionInput, {
                borderColor: themeColors.border,
                backgroundColor: themeColors.background,
                color: themeColors.text,
              }]}
              placeholder="Write a caption for your public post..."
              placeholderTextColor={themeColors.text + '80'}
              value={publicCaption}
              onChangeText={setPublicCaption}
              onSubmitEditing={Keyboard.dismiss}
              blurOnSubmit={true}
              multiline
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
            />
            
            <View style={styles.captionFooter}>
              {aiError && (
                <Text style={[styles.errorText, { color: '#ff4444' }]}>
                  {aiError}
                </Text>
              )}
              <Text style={[styles.characterCount, { color: themeColors.text + '60' }]}>
                {publicCaption.length}/300
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={acceptedFriends}
            renderItem={renderFriendItem}
            keyExtractor={item => item.other_user?.id || item.created_at}
            ListHeaderComponent={
              <View style={[styles.listHeaderContainer, { backgroundColor: themeColors.background }]}>
                  <Text style={[styles.listHeaderText, { color: themeColors.text }]}>Friends</Text>
                  <TouchableOpacity onPress={handleToggleSelectAll}>
                      <Text style={{ color: themeColors.primary, fontWeight: 'bold' }}>
                          {selectedFriends.length === allFriendIds.length ? 'Deselect All' : 'Select All'}
                      </Text>
                  </TouchableOpacity>
              </View>
            }
          />
        )}

        <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.button, styles.sendButton, { backgroundColor: isSendDisabled ? themeColors.border : themeColors.primary }]} 
                onPress={handleSend}
                disabled={isSendDisabled}
            >
                <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: 15,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    happeningSection: {
      padding: 15,
    },
    happeningLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    happeningInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      textAlignVertical: 'top',
      minHeight: 60,
    },
    helpText: {
      fontSize: 12,
      fontStyle: 'italic',
      flex: 1,
      marginRight: 8,
    },
    inputFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    characterCount: {
      fontSize: 11,
      textAlign: 'right',
    },
    captionSection: {
      padding: 15,
      borderTopWidth: 1,
      backgroundColor: 'rgba(0,0,0,0.02)',
    },
    captionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    captionLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 4,
    },
    aiControls: {
      alignItems: 'flex-end',
      gap: 8,
    },
    styleSelector: {
      flexDirection: 'row',
      gap: 4,
    },
    styleButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    styleButtonText: {
      fontSize: 10,
      fontWeight: '500',
    },
    aiGenerateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      gap: 4,
    },
    aiGenerateButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    captionInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    captionFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    errorText: {
      fontSize: 12,
      flex: 1,
    },
    storyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
    },
    storyText: {
      fontSize: 18,
    },
    divider: {
      height: 1,
      backgroundColor: '#eee',
      marginHorizontal: 15,
    },
    listHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    listHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    friendItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    friendName: {
      fontSize: 16,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 15,
      borderTopWidth: 1,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButton: {},
    cancelButton: {
        backgroundColor: '#F1F5F9', // A light gray from tailwind
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButtonText: {
        color: '#475569', // A mid-range gray
    }
  }); 