import { useState, useEffect } from 'react';

interface LiveStats {
  totalClients: number;
  totalLeads: number;
  isLoading: boolean;
}

export function useLiveStats(): LiveStats {
  const [stats, setStats] = useState<LiveStats>({
    totalClients: 0,
    totalLeads: 0,
    isLoading: true,
  });

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/public-stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalClients: data.totalClients || 2,
          totalLeads: data.totalLeads || 8,
          isLoading: false,
        });
      }
    } catch {
      setStats({
        totalClients: 2,
        totalLeads: 8,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}
