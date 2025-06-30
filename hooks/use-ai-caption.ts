import { useState } from 'react';
import { generateAiCaption, CaptionRequest, CaptionResponse } from '../lib/api';

interface UseAiCaptionResult {
  generateCaption: (request: CaptionRequest) => Promise<CaptionResponse | null>;
  isLoading: boolean;
  error: string | null;
}

export function useAiCaption(): UseAiCaptionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCaption = async (request: CaptionRequest): Promise<CaptionResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await generateAiCaption(request);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error generating AI caption:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateCaption,
    isLoading,
    error,
  };
} 