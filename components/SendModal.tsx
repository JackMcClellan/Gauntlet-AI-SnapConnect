import React, { useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useApiQuery } from '@/hooks/use-api';
import { getFriends } from '@/lib/api';
import { Friend } from '@/types/supabase';
import { Avatar } from './Avatar';

interface SendModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSend: (selections: { toStory: boolean; toPublic: boolean; toFriends: string[] }) => void;
}

export function SendModal({ isVisible, onClose, onSend }: SendModalProps) {
  const [sendToStory, setSendToStory] = useState(false);
  const [sendToPublic, setSendToPublic] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
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
  const isSendDisabled = !sendToStory && !sendToPublic && selectedFriends.length === 0;

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

  const handleSend = () => {
    onSend({ toStory: sendToStory, toPublic: sendToPublic, toFriends: selectedFriends });
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
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Send To...</Text>
        </View>
        
        <TouchableOpacity style={styles.storyItem} onPress={() => setSendToStory(!sendToStory)}>
            <Text style={[styles.storyText, { color: themeColors.text }]}>My Story</Text>
            {sendToStory ? <CheckCircle size={24} color={themeColors.primary} /> : <Circle size={24} color={themeColors.border} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.storyItem} onPress={() => setSendToPublic(!sendToPublic)}>
            <Text style={[styles.storyText, { color: themeColors.text }]}>Public View</Text>
            {sendToPublic ? <CheckCircle size={24} color={themeColors.primary} /> : <Circle size={24} color={themeColors.border} />}
        </TouchableOpacity>

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
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
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