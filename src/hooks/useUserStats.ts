import { useState, useEffect } from 'react';

interface UserStats {
  totalProjects: number;
  completedProjects: number;
  activeIncidents: number;
  testCases: number;
}

export function useUserStats(userEmail?: string): UserStats {
  const [stats, setStats] = useState<UserStats>({
    totalProjects: 0,
    completedProjects: 0,
    activeIncidents: 0,
    testCases: 0
  });

  useEffect(() => {
    if (!userEmail) return;

    // Simulate API call - replace with actual API
    const fetchUserStats = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockStats = {
          totalProjects: Math.floor(Math.random() * 20) + 5,
          completedProjects: Math.floor(Math.random() * 15) + 3,
          activeIncidents: Math.floor(Math.random() * 8) + 1,
          testCases: Math.floor(Math.random() * 50) + 10
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, [userEmail]);

  return stats;
}
