import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { PriceResponse } from '../types';

export function usePrices(symbol: string, start?: string, end?: string) {
  return useQuery({
    queryKey: ['prices', symbol, start, end],
    queryFn: async (): Promise<PriceResponse> => {
      const params: Record<string, string> = {};
      if (start) params.start = start;
      if (end) params.end = end;
      const { data } = await apiClient.get(`/api/equity/${symbol}/prices`, { params });
      return data;
    },
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });
}
