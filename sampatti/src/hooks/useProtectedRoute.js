// src/hooks/useProtectedRoute.js
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store';

/**
 * Hook for handling protected route authentication
 * 
 * @returns {Object} Authentication state for protected routes
 */
export const useProtectedRoute = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  
  const { 
    isAuthenticated, 
    loading: authLoading, 
    refreshAuthToken,
    initAuth
  } = useAuth();

  useEffect(() => {
    let mounted = true;
    
    const verifyAuth = async () => {
      // If already authenticated in the store, no need to verify further
      if (isAuthenticated && mounted) {
        setIsVerifying(false);
        return;
      }
      
      // Check if we have tokens to try to authenticate
      const hasToken = localStorage.getItem('authToken');
      const hasRefreshToken = localStorage.getItem('refreshToken');
      
      if (hasToken || hasRefreshToken) {
        try {
          // Try to initialize auth from the store
          await initAuth();
          
          // If that fails, try to refresh token as a backup
          if (!isAuthenticated) {
            await refreshAuthToken();
          }
          
          if (mounted) {
            setIsVerifying(false);
          }
        } catch (error) {
          if (mounted) {
            setIsVerifying(false);
            // Redirect to login if auth failed
            navigate('/login', { state: { from: location }, replace: true });
          }
        }
      } else if (mounted) {
        // No tokens available, redirect to login
        setIsVerifying(false);
        navigate('/login', { state: { from: location }, replace: true });
      }
    };
    
    // Only verify if the auth store isn't already loading
    if (!authLoading) {
      verifyAuth();
    } else if (mounted && !isAuthenticated) {
      // Keep verifying state true while auth is being loaded from store
      setIsVerifying(true);
    }
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authLoading, location, navigate, refreshAuthToken, initAuth]);

  return {
    isAuthenticated,
    isLoading: authLoading || isVerifying,
    isVerifying,
  };
};

export default useProtectedRoute;