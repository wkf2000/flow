import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { TickerResponse } from '../types';

export function useTickers() {
  return useQuery({
    queryKey: ['tickers'],
    queryFn: async (): Promise<TickerResponse[]> => {
      const { data } = await apiClient.get('/api/tickers');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAddTicker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string): Promise<TickerResponse> => {
      const { data } = await apiClient.post('/api/tickers', { symbol });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickers'] }),
  });
}

export function useRemoveTicker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string): Promise<void> => {
      await apiClient.delete(`/api/tickers/${symbol}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickers'] }),
  });
}
