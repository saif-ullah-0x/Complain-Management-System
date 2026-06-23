import { apiRequest } from "./queryClient";

interface LoginCredentials {
  rollNoOrId: string;
  password: string;
}

interface User {
  id: number;
  rollNoOrId: string;
  role: string;
  name: string;
  departmentId?: number;
}

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiRequest('POST', '/api/auth/login', credentials);
  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem('token', data.token);
  
  return data;
}

export async function logout(): Promise<void> {
  localStorage.removeItem('token');
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// Add token to requests
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
