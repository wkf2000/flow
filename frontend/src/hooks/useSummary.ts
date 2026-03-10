import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { SummaryResponse } from '../types';

export function useSummary(symbol: string) {
  return useQuery({
    queryKey: ['summary', symbol],
    queryFn: async (): Promise<SummaryResponse> => {
      const { data } = await apiClient.get(`/api/equity/${symbol}/summary`);
      return data;
    },
    enabled: !!symbol,
    staleTime: 60_000,
  });
}
