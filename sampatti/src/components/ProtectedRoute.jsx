// src/components/ProtectedRoute.jsx - Improved version
import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, refreshAuthToken } = useAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const verifyAuth = async () => {
      // If already authenticated, no need to verify
      if (isAuthenticated && mounted) {
        setIsAuthorized(true);
        setIsVerifying(false);
        return;
      }
      
      // Check local storage for tokens
      const hasToken = localStorage.getItem('authToken');
      const hasRefreshToken = localStorage.getItem('refreshToken');
      
      if (hasToken || hasRefreshToken) {
        // Try to refresh the token if we have one but aren't authenticated yet
        try {
          const refreshed = await refreshAuthToken();
          if (mounted) {
            setIsAuthorized(refreshed);
            setIsVerifying(false);
          }
        } catch (error) {
          if (mounted) {
            setIsAuthorized(false);
            setIsVerifying(false);
          }
        }
      } else if (mounted) {
        // No tokens available
        setIsAuthorized(false);
        setIsVerifying(false);
      }
    };
    
    // Only verify if we're not already loading (from AuthContext)
    if (!loading) {
      verifyAuth();
    } else if (mounted) {
      // If AuthContext is loading, we'll rely on its outcome
      setIsVerifying(true);
      setIsAuthorized(isAuthenticated);
    }
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, loading, refreshAuthToken]);

  // Show loading state while checking authentication
  if (loading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && !isAuthorized) {
    // Save the intended destination to return after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute;