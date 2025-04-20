// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getUserProfile, refreshAuthToken as apiRefreshToken } from '../utils/api';

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

  // Refresh token function
  const refreshAuthToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }
    
    try {
      // Call API to refresh the token
      const data = await apiRefreshToken(refreshToken);
      
      // Update the auth token
      if (data && data.access_token) {
        localStorage.setItem('authToken', data.access_token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      setError('Session expired. Please log in again.');
      return false;
    }
  }, []);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Try to get user profile with the token
        try {
          const userData = await getUserProfile();
          
          if (userData) {
            setCurrentUser(userData);
            setIsAuthenticated(true);
          }
        } catch (profileError) {
          // If token is invalid, try refreshing
          if (profileError.status === 401) {
            const refreshed = await refreshAuthToken();
            
            if (refreshed) {
              // Try getting user profile again
              try {
                const refreshedUserData = await getUserProfile();
                setCurrentUser(refreshedUserData);
                setIsAuthenticated(true);
              } catch (secondError) {
                // If still fails, log out
                logout();
              }
            } else {
              // If refresh fails, log out
              logout();
            }
          } else {
            // For other errors, log out
            logout();
          }
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [refreshAuthToken]);

  // Login function
  const login = (token, refreshToken, userData) => {
    localStorage.setItem('authToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('isLoggedIn', 'true');
    
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setError(null);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Update user data
  const updateUser = (userData) => {
    setCurrentUser(prev => ({
      ...prev,
      ...userData
    }));
  };

  // Clear auth errors
  const clearError = () => {
    setError(null);
  };

  // Context value
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