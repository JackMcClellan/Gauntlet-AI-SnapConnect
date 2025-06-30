import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAiCaption } from '../hooks/use-ai-caption';
import { CaptionRequest } from '../types/supabase';

interface AiCaptionGeneratorProps {
  fileId?: string;
  onCaptionSelected: (caption: string) => void;
  style?: any;
  initialContext?: string;
}

export function AiCaptionGenerator({ fileId, onCaptionSelected, style, initialContext }: AiCaptionGeneratorProps) {
  const { generateCaption, isLoading, error } = useAiCaption();
  const [context, setContext] = useState(initialContext || '');
  const [selectedStyle, setSelectedStyle] = useState<CaptionRequest['style']>('casual');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generatedCaption, setGeneratedCaption] = useState<string>('');

  const styles = [
    { key: 'casual', label: 'Casual' },
    { key: 'professional', label: 'Professional' },
    { key: 'funny', label: 'Funny' },
    { key: 'inspirational', label: 'Inspirational' },
  ] as const;

  const handleGenerateCaption = async () => {
    if (!fileId) {
      // Generate a simple caption without file context
      await generateSimpleCaption();
      return;
    }

    try {
      const result = await generateCaption({
        file_id: fileId,
        context: context.trim() || undefined,
        style: selectedStyle,
        max_length: 150,
      });

      if (result) {
        setGeneratedCaption(result.caption);
        setSuggestions(result.suggestions || []);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate caption. Please try again.');
    }
  };

  const generateSimpleCaption = async () => {
    // Simple caption generation based on style and context only
    const sampleCaptions = {
      casual: [
        context ? `${context} ✨` : "Just captured this moment! ✨",
        context ? `${context} 📸` : "Loving this vibe right now 📸",
        context ? `${context} 💫` : "Another day, another memory 💫"
      ],
      professional: [
        context ? `Reflecting on ${context}` : "Capturing life's important moments",
        context ? `${context} - a moment worth sharing` : "Professional excellence in every frame",
        context ? `Grateful for experiences like ${context}` : "Quality content, authentic moments"
      ],
      funny: [
        context ? `${context} (and yes, I'm this photogenic 😄)` : "When your camera skills are on point 😄",
        context ? `${context} or as I call it, 'being awesome' 😎` : "Plot twist: I actually know what I'm doing 😎",
        context ? `${context} because why not? 🤷‍♀️` : "Professional overthinker, amateur photographer 🤷‍♀️"
      ],
      inspirational: [
        context ? `${context} - reminder that beauty is everywhere` : "Every moment is a chance to find beauty",
        context ? `${context} teaches us to embrace the present` : "Life's most precious moments deserve to be shared",
        context ? `Finding joy in ${context}` : "Grateful for the journey and all its moments"
      ]
    };

    const captionsForStyle = sampleCaptions[selectedStyle || 'casual'];
    const selectedCaption = captionsForStyle[0];
    const suggestions = captionsForStyle.slice(1);

    setGeneratedCaption(selectedCaption);
    setSuggestions(suggestions);
  };

  const handleSelectCaption = (caption: string) => {
    onCaptionSelected(caption);
    Alert.alert('Success', 'Caption selected!');
  };

  return (
    <ScrollView style={[{ padding: 16, backgroundColor: '#f9f9f9', borderRadius: 12 }, style]}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>
        AI Caption Generator ✨
      </Text>
      
      {!fileId && (
        <View style={{
          backgroundColor: '#e3f2fd',
          padding: 8,
          borderRadius: 6,
          marginBottom: 12,
          borderLeftWidth: 3,
          borderLeftColor: '#2196f3',
        }}>
          <Text style={{ fontSize: 12, color: '#1976d2' }}>
            💡 Using smart template mode - full AI analysis available after upload
          </Text>
        </View>
      )}

      {/* Context Input */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#555' }}>
          Additional Context (Optional)
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            padding: 12,
            backgroundColor: 'white',
            textAlignVertical: 'top',
          }}
          placeholder="Describe what's happening in your photo/video..."
          value={context}
          onChangeText={setContext}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Style Selection */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#555' }}>
          Caption Style
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {styles.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedStyle === key ? '#007AFF' : '#e0e0e0',
                borderWidth: 1,
                borderColor: selectedStyle === key ? '#007AFF' : '#ccc',
              }}
              onPress={() => setSelectedStyle(key)}
            >
              <Text style={{
                color: selectedStyle === key ? 'white' : '#333',
                fontWeight: selectedStyle === key ? '600' : '400',
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 16,
          opacity: isLoading ? 0.6 : 1,
        }}
        onPress={handleGenerateCaption}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: '600' }}>Generating...</Text>
          </View>
        ) : (
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
            Generate AI Caption
          </Text>
        )}
      </TouchableOpacity>

      {/* Error Display */}
      {error && (
        <View style={{
          backgroundColor: '#ffe6e6',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#ff4444',
        }}>
          <Text style={{ color: '#cc0000', fontSize: 14 }}>
            Error: {error}
          </Text>
        </View>
      )}

      {/* Generated Caption */}
      {generatedCaption && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#555' }}>
            Generated Caption
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              padding: 12,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: '#007AFF',
              marginBottom: 8,
            }}
            onPress={() => handleSelectCaption(generatedCaption)}
          >
            <Text style={{ fontSize: 16, color: '#333', lineHeight: 20 }}>
              {generatedCaption}
            </Text>
            <Text style={{ fontSize: 12, color: '#007AFF', marginTop: 4, fontWeight: '600' }}>
              Tap to use this caption
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#555' }}>
            Alternative Suggestions
          </Text>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={{
                backgroundColor: 'white',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#ddd',
                marginBottom: 8,
              }}
              onPress={() => handleSelectCaption(suggestion)}
            >
              <Text style={{ fontSize: 14, color: '#333', lineHeight: 18 }}>
                {suggestion}
              </Text>
              <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                Tap to use
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
} 