import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeComplaints() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Use polling as a simple real-time solution
    const interval = setInterval(() => {
      // Invalidate complaint queries to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  // Function to manually refresh complaints
  const refreshComplaints = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/complaints'] });
    queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
  };

  return { refreshComplaints };
}