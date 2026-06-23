import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { isAuthenticated } from "@/lib/auth";

export interface User {
  id: number;
  rollNoOrId: string;
  role: string;
  name: string;
  departmentId?: number;
}

export function useUser() {
  return useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated(),
    retry: false,
    staleTime: Infinity,
  });
}
