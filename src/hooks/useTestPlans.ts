import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export interface TestPlan {
  id: string;
  projectId: string;
  projectName: string;
  codeReference: string;
  startDate: string;
  endDate: string;
  estimatedHours: number;
  estimatedDays: number;
  totalCases: number;
  testQuality: number;
  cycles: {
    id: string;
    number: number;
    designed: number;
    successful: number;
    notExecuted: number;
    defects: number;
  }[];
}

export function useTestPlans(projectId?: string) {
  const { data, error, isLoading } = useSWR(
    projectId ? `/api/test-plans?projectId=${projectId}` : null,
    fetcher
  );

  return {
    testPlans: (data || []) as TestPlan[],
    isLoading,
    isError: error
  };
}
