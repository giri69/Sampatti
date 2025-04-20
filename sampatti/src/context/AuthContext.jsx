// src/context/AuthContext.jsx - Improved version
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getUserProfile, refreshTokenApi } from '../utils/api';

// Create auth context with default values
const AuthContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshAuthToken: () => Promise.resolve(false),
  clearError: () => {}
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTimer, setRefreshTimer] = useState(null);

  // Refresh token function
  const refreshAuthToken = useCallback(async (silent = false) => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      if (!silent) console.log('No refresh token available');
      return false;
    }
    
    try {
      // Call API to refresh the token
      const data = await refreshTokenApi();
      
      // Update the auth token
      if (data && data.access_token) {
        localStorage.setItem('authToken', data.access_token);
        return true;
      }
      
      return false;
    } catch (error) {
      if (!silent) {
        console.error('Token refresh error:', error);
        logout();
        setError('Session expired. Please log in again.');
      }
      return false;
    }
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    // Clean up any existing timer
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    
    // Only set up refresh timer if authenticated
    if (isAuthenticated) {
      // Refresh token every 14 minutes (tokens expire in 15 minutes)
      const timer = setInterval(() => {
        refreshAuthToken(true); // Silent refresh
      }, 14 * 60 * 1000);
      
      setRefreshTimer(timer);
    }
    
    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [isAuthenticated, refreshAuthToken]);

  // Check authentication status on app load
  useEffect(() => {
    let mounted = true;
    
    const checkAuthStatus = async () => {
      try {
        if (!mounted) return;
        
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        // Try to get user profile with the token
        try {
          const userData = await getUserProfile();
          
          if (userData && mounted) {
            setCurrentUser(userData);
            setIsAuthenticated(true);
          }
        } catch (profileError) {
          console.error("Profile fetch error:", profileError);
          
          // If token is invalid, try refreshing
          if (profileError.status === 401 && mounted) {
            const refreshed = await refreshAuthToken();
            
            if (refreshed && mounted) {
              // Try getting user profile again with new token
              try {
                const refreshedUserData = await getUserProfile();
                if (mounted) {
                  setCurrentUser(refreshedUserData);
                  setIsAuthenticated(true);
                }
              } catch (secondError) {
                console.error("Second profile fetch error:", secondError);
                if (mounted) logout();
              }
            } else if (mounted) {
              logout();
            }
          } else if (mounted) {
            logout();
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        if (mounted) logout();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuthStatus();
    
    return () => {
      mounted = false;
    };
  }, [refreshAuthToken]);

  // Login function
  const login = useCallback((token, refreshToken, userData) => {
    localStorage.setItem('authToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('isLoggedIn', 'true');
    
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setError(null);
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    
    // Clear any refresh timers
    if (refreshTimer) {
      clearInterval(refreshTimer);
      setRefreshTimer(null);
    }
    
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, [refreshTimer]);

  // Update user data
  const updateUser = useCallback((userData) => {
    setCurrentUser(prev => ({
      ...prev,
      ...userData
    }));
  }, []);

  // Clear auth errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value with memoized callbacks
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    updateUser,
    refreshAuthToken,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;