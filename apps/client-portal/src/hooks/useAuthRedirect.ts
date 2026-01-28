
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export function useAuthRedirect(redirectTo = '/login') {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      const checkAuth = async () => {
        try {
          const token = localStorage.getItem('authToken');
          
          if (!token) {
            setIsAuth(false);
            router.replace(redirectTo);
            setIsCheckingAuth(false);
            return;
          }

          // Use centralized auth check
          await authApi.me();
          console.log('Authentication successful');
          setIsAuth(true);
        } catch (error) {
          console.error('Authentication check failed:', error);
          setIsAuth(false);
          // Clear invalid token data
          localStorage.removeItem('authToken');
          router.replace(redirectTo);
        } finally {
          setIsCheckingAuth(false);
        }
      };
      checkAuth();
    }
  }, [router, redirectTo]);

  return { isCheckingAuth, isAuthenticated: isAuth };
}
