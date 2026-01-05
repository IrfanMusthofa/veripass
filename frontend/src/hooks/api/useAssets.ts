import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateAssetRequest, UpdateMintStatusRequest, AssetResponse, ApiResponse } from '@/types/api';

// Query key factory
export const assetKeys = {
  all: ['assets'] as const,
  byId: (assetId: number) => [...assetKeys.all, 'byId', assetId] as const,
  byHash: (hash: string) => [...assetKeys.all, 'byHash', hash] as const,
};

// Get asset by ID
export function useAssetById(assetId: number | undefined, enabled: boolean = true) {
  return useQuery<ApiResponse<AssetResponse>>({
    queryKey: assetKeys.byId(assetId!),
    queryFn: () => api.getAssetById(assetId!),
    enabled: enabled && assetId !== undefined,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get asset by hash
export function useAssetByHash(hash: string | undefined, enabled: boolean = true) {
  return useQuery<ApiResponse<AssetResponse>>({
    queryKey: assetKeys.byHash(hash!),
    queryFn: () => api.getAssetByHash(hash!),
    enabled: enabled && !!hash && hash !== '0x0000000000000000000000000000000000000000000000000000000000000000',
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on 404 (asset not found in backend)
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Create asset mutation
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssetRequest) => api.createAsset(data),
    onSuccess: (response) => {
      // Invalidate asset queries
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      // Pre-populate cache with new asset
      queryClient.setQueryData(assetKeys.byId(response.data.assetId), response);
      queryClient.setQueryData(assetKeys.byHash(response.data.dataHash), response);
    },
  });
}

// Update mint status mutation
export function useUpdateMintStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, data }: { assetId: number; data: UpdateMintStatusRequest }) =>
      api.updateMintStatus(assetId, data),
    onSuccess: (response) => {
      // Update cache with new status
      queryClient.setQueryData(assetKeys.byId(response.data.assetId), response);
      queryClient.setQueryData(assetKeys.byHash(response.data.dataHash), response);
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}
