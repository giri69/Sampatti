// src/store/index.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  loginUser, registerUser, refreshTokenApi, getUserProfile,
  updateUserProfile, updateUserSettings, changePassword,
  getAssets, createAsset, updateAsset, deleteAsset, getAssetById,
  updateAssetValue, getPortfolioSummary, getAssetHistory,
  getNominees, createNominee, updateNominee, deleteNominee,
  sendNomineeInvitation, getNomineeAccessLogs,
  getAlerts, markAlertAsRead
} from '../utils/api';

// Authentication slice
const createAuthSlice = (set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  authLoading: true,
  authError: null,
  
  initAuth: async () => {
    try {
      set({ authLoading: true, authError: null });
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        set({ isAuthenticated: false, authLoading: false });
        return false;
      }
      
      try {
        const userData = await getUserProfile();
        set({ currentUser: userData, isAuthenticated: true, authLoading: false });
        return true;
      } catch (error) {
        if (error.status === 401) {
          const refreshed = await get().refreshAuthToken();
          
          if (refreshed) {
            const userData = await getUserProfile();
            set({ currentUser: userData, isAuthenticated: true, authLoading: false });
            return true;
          }
        }
        throw error;
      }
    } catch (error) {
      set({ 
        authError: error.message || 'Authentication failed', 
        isAuthenticated: false, 
        currentUser: null,
        authLoading: false 
      });
      get().logout();
      return false;
    }
  },
  
  login: async (email, password) => {
    try {
      set({ authLoading: true, authError: null });
      const data = await loginUser(email, password);
      
      if (data && data.access_token) {
        localStorage.setItem('authToken', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
        localStorage.setItem('isLoggedIn', 'true');
        
        set({ 
          currentUser: data.user || { email },
          isAuthenticated: true,
          authLoading: false
        });
        
        // Setup token refresh interval
        get().setupTokenRefresh();
        
        return data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      set({ authError: error.message || 'Login failed', authLoading: false });
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      set({ authLoading: true, authError: null });
      const data = await registerUser(userData);
      set({ authLoading: false });
      return data;
    } catch (error) {
      set({ authError: error.message || 'Registration failed', authLoading: false });
      throw error;
    }
  },
  
  refreshAuthToken: async (silent = false) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      
      const data = await refreshTokenApi();
      
      if (data && data.access_token) {
        localStorage.setItem('authToken', data.access_token);
        return true;
      }
      return false;
    } catch (error) {
      if (!silent) {
        set({ authError: 'Session expired. Please log in again.' });
        get().logout();
      }
      return false;
    }
  },
  
  setupTokenRefresh: () => {
    // Clear any existing interval
    if (window.tokenRefreshInterval) {
      clearInterval(window.tokenRefreshInterval);
    }
    
    // Set up new interval - refresh token every 14 minutes (assuming token expires in 15 minutes)
    window.tokenRefreshInterval = setInterval(() => {
      get().refreshAuthToken(true);
    }, 14 * 60 * 1000);
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    
    if (window.tokenRefreshInterval) {
      clearInterval(window.tokenRefreshInterval);
    }
    
    set({
      currentUser: null,
      isAuthenticated: false,
      authError: null
    });
  },
  
  updateUser: async (userData) => {
    try {
      set({ authLoading: true });
      await updateUserProfile(userData);
      set({ 
        currentUser: { ...get().currentUser, ...userData },
        authLoading: false 
      });
    } catch (error) {
      set({ authError: error.message || 'Failed to update profile', authLoading: false });
      throw error;
    }
  },
  
  updateSettings: async (settings) => {
    try {
      set({ authLoading: true });
      await updateUserSettings(settings);
      set({ 
        currentUser: { ...get().currentUser, ...settings },
        authLoading: false 
      });
    } catch (error) {
      set({ authError: error.message || 'Failed to update settings', authLoading: false });
      throw error;
    }
  },
  
  changePassword: async (oldPassword, newPassword) => {
    try {
      set({ authLoading: true });
      await changePassword(oldPassword, newPassword);
      set({ authLoading: false });
    } catch (error) {
      set({ authError: error.message || 'Failed to change password', authLoading: false });
      throw error;
    }
  },
  
  clearAuthError: () => set({ authError: null })
});

// Assets/Investments slice
const createAssetsSlice = (set, get) => ({
  assets: [],
  currentAsset: null,
  assetHistory: [],
  portfolioSummary: null,
  assetsLoading: false,
  assetError: null,
  
  fetchAssets: async () => {
    try {
      set({ assetsLoading: true, assetError: null });
      const assetsData = await getAssets();
      set({ assets: assetsData || [], assetsLoading: false });
      return assetsData;
    } catch (error) {
      set({ assetError: error.message || 'Failed to fetch assets', assetsLoading: false });
      return [];
    }
  },
  
  fetchAssetById: async (assetId) => {
    try {
      set({ assetsLoading: true, assetError: null });
      const asset = await getAssetById(assetId);
      set({ currentAsset: asset, assetsLoading: false });
      return asset;
    } catch (error) {
      set({ assetError: error.message || 'Failed to fetch asset details', assetsLoading: false });
      throw error;
    }
  },
  
  fetchAssetHistory: async (assetId) => {
    try {
      set({ assetsLoading: true, assetError: null });
      const history = await getAssetHistory(assetId);
      set({ assetHistory: history || [], assetsLoading: false });
      return history;
    } catch (error) {
      set({ assetError: error.message || 'Failed to fetch asset history', assetsLoading: false });
      return [];
    }
  },
  
  fetchPortfolioSummary: async () => {
    try {
      set({ assetsLoading: true, assetError: null });
      const summary = await getPortfolioSummary();
      set({ portfolioSummary: summary, assetsLoading: false });
      return summary;
    } catch (error) {
      set({ 
        assetError: error.message || 'Failed to fetch portfolio summary', 
        assetsLoading: false 
      });
      return null;
    }
  },
  
  createAsset: async (assetData) => {
    try {
      set({ assetsLoading: true, assetError: null });
      const newAsset = await createAsset(assetData);
      set(state => ({ 
        assets: [...state.assets, newAsset],
        assetsLoading: false 
      }));
      return newAsset;
    } catch (error) {
      set({ assetError: error.message || 'Failed to create asset', assetsLoading: false });
      throw error;
    }
  },
  
  updateAsset: async (assetId, assetData) => {
    try {
      set({ assetsLoading: true, assetError: null });
      const updatedAsset = await updateAsset(assetId, assetData);
      set(state => ({ 
        assets: state.assets.map(asset => 
          asset.id === assetId ? updatedAsset : asset
        ),
        currentAsset: state.currentAsset?.id === assetId ? updatedAsset : state.currentAsset,
        assetsLoading: false 
      }));
      return updatedAsset;
    } catch (error) {
      set({ assetError: error.message || 'Failed to update asset', assetsLoading: false });
      throw error;
    }
  },
  
  updateAssetValue: async (assetId, value, notes = '') => {
    try {
      set({ assetsLoading: true, assetError: null });
      await updateAssetValue(assetId, value, notes);
      
      // Update the local asset state
      set(state => {
        const updatedAssets = state.assets.map(asset => {
          if (asset.id === assetId) {
            return { ...asset, current_value: parseFloat(value) };
          }
          return asset;
        });
        
        const updatedCurrentAsset = state.currentAsset?.id === assetId 
          ? { ...state.currentAsset, current_value: parseFloat(value) }
          : state.currentAsset;
        
        return {
          assets: updatedAssets,
          currentAsset: updatedCurrentAsset,
          assetsLoading: false
        };
      });
      
      // Refresh portfolio summary if we have it
      if (get().portfolioSummary) {
        get().fetchPortfolioSummary();
      }
      
      return true;
    } catch (error) {
      set({ assetError: error.message || 'Failed to update asset value', assetsLoading: false });
      throw error;
    }
  },
  
  deleteAsset: async (assetId) => {
    try {
      set({ assetsLoading: true, assetError: null });
      await deleteAsset(assetId);
      set(state => ({
        assets: state.assets.filter(asset => asset.id !== assetId),
        currentAsset: state.currentAsset?.id === assetId ? null : state.currentAsset,
        assetsLoading: false
      }));
      return true;
    } catch (error) {
      set({ assetError: error.message || 'Failed to delete asset', assetsLoading: false });
      throw error;
    }
  },
  
  clearAssetError: () => set({ assetError: null }),
  clearCurrentAsset: () => set({ currentAsset: null })
});

// Nominees slice
const createNomineesSlice = (set, get) => ({
  nominees: [],
  nomineeAccessLogs: [],
  nomineesLoading: false,
  nomineeError: null,
  
  fetchNominees: async () => {
    try {
      set({ nomineesLoading: true, nomineeError: null });
      const nomineesData = await getNominees();
      set({ nominees: nomineesData || [], nomineesLoading: false });
      return nomineesData;
    } catch (error) {
      set({ nomineeError: error.message || 'Failed to fetch nominees', nomineesLoading: false });
      return [];
    }
  },
  
  fetchNomineeAccessLogs: async () => {
    try {
      set({ nomineesLoading: true, nomineeError: null });
      const logsData = await getNomineeAccessLogs();
      set({ nomineeAccessLogs: logsData || [], nomineesLoading: false });
      return logsData;
    } catch (error) {
      set({ 
        nomineeError: error.message || 'Failed to fetch nominee access logs', 
        nomineesLoading: false 
      });
      return [];
    }
  },
  
  createNominee: async (nomineeData) => {
    try {
      set({ nomineesLoading: true, nomineeError: null });
      const newNominee = await createNominee(nomineeData);
      set(state => ({ 
        nominees: [...state.nominees, newNominee],
        nomineesLoading: false 
      }));
      return newNominee;
    } catch (error) {
      set({ nomineeError: error.message || 'Failed to create nominee', nomineesLoading: false });
      throw error;
    }
  },
  
  updateNominee: async (nomineeId, nomineeData) => {
    try {
      set({ nomineesLoading: true, nomineeError: null });
      const updatedNominee = await updateNominee(nomineeId, nomineeData);
      set(state => ({ 
        nominees: state.nominees.map(nominee => 
          nominee.id === nomineeId ? updatedNominee : nominee
        ),
        nomineesLoading: false 
      }));
      return updatedNominee;
    } catch (error) {
      set({ nomineeError: error.message || 'Failed to update nominee', nomineesLoading: false });
      throw error;
    }
  },
  
  deleteNominee: async (nomineeId) => {
    try {
      set({ nomineesLoading: true, nomineeError: null });
      await deleteNominee(nomineeId);
      set(state => ({
        nominees: state.nominees.filter(nominee => nominee.id !== nomineeId),
        nomineesLoading: false
      }));
      return true;
    } catch (error) {
      set({ nomineeError: error.message || 'Failed to delete nominee', nomineesLoading: false });
      throw error;
    }
  },
  
  sendNomineeInvitation: async (nomineeId) => {
    try {
      set({ nomineesLoading: true, nomineeError: null });
      const inviteCode = await sendNomineeInvitation(nomineeId);
      
      // Update nominee status in store
      set(state => ({
        nominees: state.nominees.map(nominee => 
          nominee.id === nomineeId 
            ? { ...nominee, status: 'Pending' }
            : nominee
        ),
        nomineesLoading: false
      }));
      
      return inviteCode;
    } catch (error) {
      set({ 
        nomineeError: error.message || 'Failed to send nominee invitation', 
        nomineesLoading: false 
      });
      throw error;
    }
  },
  
  clearNomineeError: () => set({ nomineeError: null })
});

// Alerts slice
const createAlertsSlice = (set) => ({
  alerts: [],
  alertsLoading: false,
  alertError: null,
  
  fetchAlerts: async (includeRead = false) => {
    try {
      set({ alertsLoading: true, alertError: null });
      const alertsData = await getAlerts(includeRead);
      set({ alerts: alertsData || [], alertsLoading: false });
      return alertsData;
    } catch (error) {
      set({ alertError: error.message || 'Failed to fetch alerts', alertsLoading: false });
      return [];
    }
  },
  
  markAlertAsRead: async (alertId) => {
    try {
      await markAlertAsRead(alertId);
      
      // Update alert in local state
      set(state => ({
        alerts: state.alerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, is_read: true }
            : alert
        )
      }));
      
      return true;
    } catch (error) {
      set({ alertError: error.message || 'Failed to mark alert as read' });
      throw error;
    }
  },
  
  clearAlertError: () => set({ alertError: null })
});

// Create the main store with all slices
export const useStore = create(
  persist(
    (set, get) => ({
      ...createAuthSlice(set, get),
      ...createAssetsSlice(set, get),
      ...createNomineesSlice(set, get),
      ...createAlertsSlice(set),
    }),
    {
      name: 'sampatti-storage',
      // Only persist non-sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Individual hooks for better code splitting
export const useAuth = () => {
  const store = useStore();
  return {
    currentUser: store.currentUser,
    isAuthenticated: store.isAuthenticated,
    loading: store.authLoading,
    error: store.authError,
    login: store.login,
    register: store.register,
    logout: store.logout,
    initAuth: store.initAuth,
    updateUser: store.updateUser,
    updateSettings: store.updateSettings,
    changePassword: store.changePassword,
    refreshAuthToken: store.refreshAuthToken,
    clearError: store.clearAuthError
  };
};

export const useAssets = () => {
  const store = useStore();
  return {
    assets: store.assets,
    currentAsset: store.currentAsset,
    assetHistory: store.assetHistory,
    portfolioSummary: store.portfolioSummary,
    loading: store.assetsLoading,
    error: store.assetError,
    fetchAssets: store.fetchAssets,
    fetchAssetById: store.fetchAssetById,
    fetchAssetHistory: store.fetchAssetHistory,
    fetchPortfolioSummary: store.fetchPortfolioSummary,
    createAsset: store.createAsset,
    updateAsset: store.updateAsset,
    updateAssetValue: store.updateAssetValue,
    deleteAsset: store.deleteAsset,
    clearError: store.clearAssetError,
    clearCurrentAsset: store.clearCurrentAsset
  };
};

export const useNominees = () => {
  const store = useStore();
  return {
    nominees: store.nominees,
    accessLogs: store.nomineeAccessLogs,
    loading: store.nomineesLoading,
    error: store.nomineeError,
    fetchNominees: store.fetchNominees,
    fetchAccessLogs: store.fetchNomineeAccessLogs,
    createNominee: store.createNominee,
    updateNominee: store.updateNominee,
    deleteNominee: store.deleteNominee,
    sendInvitation: store.sendNomineeInvitation,
    clearError: store.clearNomineeError
  };
};

export const useAlerts = () => {
  const store = useStore();
  return {
    alerts: store.alerts,
    loading: store.alertsLoading,
    error: store.alertError,
    fetchAlerts: store.fetchAlerts,
    markAsRead: store.markAlertAsRead,
    clearError: store.clearAlertError
  };
};