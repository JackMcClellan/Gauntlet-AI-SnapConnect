import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Search, Sparkles, Tag, Users } from 'lucide-react-native';
import { useRAGSearch } from '@/hooks/use-rag-search';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface RAGSearchExampleProps {
  placeholder?: string;
  maxResults?: number;
}

export function RAGSearchExample({ 
  placeholder = "Ask about your content...", 
  maxResults = 10 
}: RAGSearchExampleProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'semantic' | 'tags' | 'hybrid'>('hybrid');
  
  const { 
    searchContent, 
    isLoading, 
    error, 
    results, 
    generatedResponse, 
    lastQuery,
    clearResults 
  } = useRAGSearch();

  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    await searchContent(query, {
      search_type: searchType,
      max_results: maxResults,
      generate_response: true
    });
  };

  const SearchTypeButton = ({ 
    type, 
    label, 
    icon: Icon 
  }: { 
    type: typeof searchType, 
    label: string, 
    icon: React.ComponentType<any> 
  }) => (
    <TouchableOpacity
      style={[
        styles.searchTypeButton,
        { 
          backgroundColor: searchType === type ? themeColors.primary : themeColors.background,
          borderColor: themeColors.border
        }
      ]}
      onPress={() => setSearchType(type)}
    >
      <Icon 
        size={16} 
        color={searchType === type ? 'white' : themeColors.text} 
      />
      <Text style={[
        styles.searchTypeText,
        { color: searchType === type ? 'white' : themeColors.text }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>
        Search Your Content
      </Text>
      
      {/* Search Type Selector */}
      <View style={styles.searchTypeContainer}>
        <SearchTypeButton type="hybrid" label="Smart" icon={Sparkles} />
        <SearchTypeButton type="semantic" label="Semantic" icon={Search} />
        <SearchTypeButton type="tags" label="Tags" icon={Tag} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { 
              borderColor: themeColors.border,
              backgroundColor: themeColors.background,
              color: themeColors.text
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={themeColors.text + '80'}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.searchButton,
            { 
              backgroundColor: themeColors.primary,
              opacity: (!query.trim() || isLoading) ? 0.5 : 1
            }
          ]}
          onPress={handleSearch}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Search size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Example Queries */}
      <View style={styles.exampleContainer}>
        <Text style={[styles.exampleTitle, { color: themeColors.text + '80' }]}>
          Try asking:
        </Text>
        {[
          "Show me my coffee photos",
          "What workouts have I done?",
          "When did I last go to the beach?",
          "Find my social gatherings"
        ].map((example, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.exampleButton, { borderColor: themeColors.border }]}
            onPress={() => setQuery(example)}
          >
            <Text style={[styles.exampleText, { color: themeColors.primary }]}>
              "{example}"
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: '#fee' }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {(results.length > 0 || generatedResponse) && (
        <ScrollView style={styles.resultsContainer}>
          {generatedResponse && (
            <View style={[styles.responseContainer, { backgroundColor: themeColors.primary + '10' }]}>
              <View style={styles.responseHeader}>
                <Sparkles size={16} color={themeColors.primary} />
                <Text style={[styles.responseHeaderText, { color: themeColors.primary }]}>
                  AI Response
                </Text>
              </View>
              <Text style={[styles.responseText, { color: themeColors.text }]}>
                {generatedResponse}
              </Text>
            </View>
          )}

          {results.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={[styles.resultsSectionTitle, { color: themeColors.text }]}>
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </Text>
              {results.map((result, index) => (
                <View 
                  key={result.id} 
                  style={[
                    styles.resultItem, 
                    { 
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border 
                    }
                  ]}
                >
                  <Text style={[styles.resultContext, { color: themeColors.text }]}>
                    {result.user_context || result.caption || 'No description'}
                  </Text>
                  <View style={styles.resultMeta}>
                    {result.tags && result.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {result.tags.slice(0, 3).map((tag, tagIndex) => (
                          <View 
                            key={tagIndex} 
                            style={[styles.tag, { backgroundColor: themeColors.primary + '20' }]}
                          >
                            <Text style={[styles.tagText, { color: themeColors.primary }]}>
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {result.similarity && (
                      <Text style={[styles.similarity, { color: themeColors.text + '60' }]}>
                        {(result.similarity * 100).toFixed(0)}% match
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Clear Results */}
      {(results.length > 0 || generatedResponse || error) && (
        <TouchableOpacity
          style={[styles.clearButton, { borderColor: themeColors.border }]}
          onPress={clearResults}
        >
          <Text style={[styles.clearButtonText, { color: themeColors.text }]}>
            Clear Results
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  searchTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exampleContainer: {
    marginBottom: 16,
  },
  exampleTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  exampleButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c53030',
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
  },
  responseContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  responseHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
  },
  resultsSection: {
    marginBottom: 16,
  },
  resultsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  resultContext: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  similarity: {
    fontSize: 12,
  },
  clearButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 