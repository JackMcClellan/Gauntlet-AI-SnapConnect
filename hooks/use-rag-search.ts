import { useState } from 'react';
import { ragSearch } from '@/lib/api';
import { RAGSearchRequest, RAGSearchResponse, ContentResult } from '@/types/supabase';

interface UseRAGSearchResult {
  searchContent: (query: string, options?: Partial<RAGSearchRequest>) => Promise<RAGSearchResponse | null>;
  isLoading: boolean;
  error: string | null;
  results: ContentResult[];
  generatedResponse: string | null;
  lastQuery: string | null;
  clearResults: () => void;
}

export function useRAGSearch(): UseRAGSearchResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ContentResult[]>([]);
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const searchContent = async (
    query: string, 
    options: Partial<RAGSearchRequest> = {}
  ): Promise<RAGSearchResponse | null> => {
    if (!query.trim()) {
      setError('Query cannot be empty');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setLastQuery(query);

    try {
      const searchPayload: RAGSearchRequest = {
        query: query.trim(),
        search_type: options.search_type || 'hybrid',
        max_results: options.max_results || 10,
        generate_response: options.generate_response !== false, // Default to true
        ...options
      };

      const response = await ragSearch(searchPayload);
      
      setResults(response.results);
      setGeneratedResponse(response.generated_response || null);
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search content';
      setError(errorMessage);
      setResults([]);
      setGeneratedResponse(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setGeneratedResponse(null);
    setError(null);
    setLastQuery(null);
  };

  return {
    searchContent,
    isLoading,
    error,
    results,
    generatedResponse,
    lastQuery,
    clearResults
  };
}

// Helper hook for quick semantic search
export function useSemanticSearch() {
  const ragSearch = useRAGSearch();
  
  const semanticSearch = (query: string, maxResults: number = 10) =>
    ragSearch.searchContent(query, { 
      search_type: 'semantic', 
      max_results: maxResults,
      generate_response: false 
    });

  return {
    ...ragSearch,
    semanticSearch
  };
}

// Helper hook for tag-based search
export function useTagSearch() {
  const ragSearch = useRAGSearch();
  
  const tagSearch = (query: string, maxResults: number = 10) =>
    ragSearch.searchContent(query, { 
      search_type: 'tags', 
      max_results: maxResults,
      generate_response: false 
    });

  return {
    ...ragSearch,
    tagSearch
  };
} 