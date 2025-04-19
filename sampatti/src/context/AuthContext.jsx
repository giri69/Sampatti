import { createContext, useState, useContext, useEffect } from 'react';
import { getUserProfile } from '../utils/api';

// Create the auth context with default values
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

  // Check if user is logged in when the app loads
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          // Attempt to get user profile with stored token
          const userData = await getUserProfile();
          setCurrentUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Authentication error:', error);
          // If token is invalid or expired, log out
          logout();
          setError('Session expired. Please log in again.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Login function - to be called after successful authentication
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
    // Clear all auth-related data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    
    // Reset auth state
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Update user data
  const updateUser = (userData) => {
    setCurrentUser(userData);
  };

  // Function to handle token refresh
  const refreshAuthToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      logout();
      setError('No refresh token available. Please log in again.');
      return false;
    }
    
    try {
      // This would call your API to refresh the token
      const response = await fetch('/api/v1/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      // Update the auth token
      localStorage.setItem('authToken', data.access_token);
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      setError('Session expired. Please log in again.');
      return false;
    }
  };

  // Clear any auth errors
  const clearError = () => {
    setError(null);
  };

  // Provide auth context values
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