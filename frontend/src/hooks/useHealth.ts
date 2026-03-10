import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { IngestResponse } from '../types';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get('/health');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useIngest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<IngestResponse> => {
      const { data } = await apiClient.post('/api/ingest');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prices'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}
