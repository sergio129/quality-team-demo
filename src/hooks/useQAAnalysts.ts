import useSWR from 'swr';
import { QAAnalyst } from '@/models/QAAnalyst';
import { fetcher } from '@/lib/fetcher';

export function useQAAnalysts() {
  const { data, error, isLoading } = useSWR<QAAnalyst[]>('/api/analysts', fetcher);

  return {
    analysts: data || [],
    isLoading,
    isError: error
  };
}
