import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Query key factory
export const serviceRecordKeys = {
  all: ['serviceRecords'] as const,
  byAsset: (assetId: number) => [...serviceRecordKeys.all, 'byAsset', assetId] as const,
};

// Get service records for an asset
export function useServiceRecords(assetId: number | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['serviceRecords', assetId],
    queryFn: () => api.getServiceRecords(assetId!),
    enabled: enabled && assetId !== undefined,
    staleTime: 60 * 1000, // 1 minute
  });
}
