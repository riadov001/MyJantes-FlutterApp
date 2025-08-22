import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  smsConsent: boolean;
  emailConsent: boolean;
  dataProcessingConsent: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { data: user, error, refetch } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else if (error) {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [user, error]);

  const login = async (redirectTo?: string) => {
    const url = redirectTo ? `/api/login?redirect=${encodeURIComponent(redirectTo)}` : '/api/login';
    window.location.href = url;
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setIsAuthenticated(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if request fails
      setIsAuthenticated(false);
      window.location.href = '/';
    }
  };

  const refresh = () => {
    refetch();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refresh,
  };
}