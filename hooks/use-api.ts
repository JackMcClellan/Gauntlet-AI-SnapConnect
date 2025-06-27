import { useQuery, useMutation, useQueryClient, QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

// Generic hook for handling API queries (GET requests)
export function useApiQuery<TData>({
  queryKey,
  queryFn,
  ...options
}: UseQueryOptions<TData>) {
  return useQuery<TData>({
    queryKey,
    queryFn,
    ...options
  });
}

// Generic hook for handling API mutations (POST, PATCH, DELETE)
export function useApiMutation<TData, TVariables, TContext = unknown>(
  options: UseMutationOptions<TData, Error, TVariables, TContext> & {
    invalidateQueries?: QueryKey[];
  }
) {
  const queryClient = useQueryClient();
  const { invalidateQueries, onSuccess, ...mutationOptions } = options;

  return useMutation({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      onSuccess?.(data, variables, context);
    },
  });
} 