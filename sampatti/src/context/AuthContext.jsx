// src/context/AuthContext.jsx - Converted to use Zustand store
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth as useAuthStore } from '../store';

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
  const [initialized, setInitialized] = useState(false);
  
  // Use the Zustand auth store
  const { 
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    updateUser,
    initAuth,
    refreshAuthToken,
    clearError
  } = useAuthStore();

  // Initialize authentication on app load
  useEffect(() => {
    if (!initialized) {
      initAuth().finally(() => {
        setInitialized(true);
      });
    }
  }, [initAuth, initialized]);

  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    loading: loading || !initialized,
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