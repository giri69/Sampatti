// src/utils/api.js - Improved version with better error handling and token refresh
const API_BASE_URL = '/api/v1';

// Create a reusable function to handle API response errors
const handleApiResponse = async (response) => {
  // Handle non-OK responses
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage;
    let errorDetails = { status: response.status };
    
    // Try to parse error as JSON if possible
    try {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `HTTP error ${response.status}`;
        errorDetails = { ...errorDetails, ...errorData };
      } else {
        errorMessage = await response.text() || `HTTP error ${response.status}`;
      }
    } catch (parseError) {
      errorMessage = `HTTP error ${response.status}`;
    }
    
    // Create rich error object
    const error = new Error(errorMessage);
    error.status = response.status;
    error.details = errorDetails;
    throw error;
  }
  
  // Check if response is empty or not JSON
  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType) {
    return null;
  }
  
  // Parse response based on content type
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
};

// Add a token refresh mechanism
let isRefreshing = false;
let refreshPromise = null;
const waitingRequests = [];

const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  
  const data = await handleApiResponse(response);
  if (data && data.access_token) {
    localStorage.setItem('authToken', data.access_token);
    return data.access_token;
  }
  
  throw new Error('Failed to refresh token');
};

// Enhanced fetchApi with automatic token refresh
const fetchApi = async (endpoint, options = {}, retryCount = 0) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle token expiration
    if (response.status === 401 && retryCount === 0) {
      // If a token refresh is already in progress, wait for it
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitingRequests.push({ resolve, reject, endpoint, options });
        });
      }
      
      try {
        // Set refreshing flag and start refresh
        isRefreshing = true;
        refreshPromise = refreshAuthToken();
        
        // Wait for token refresh
        await refreshPromise;
        
        // Retry the original request with new token
        return fetchApi(endpoint, options, retryCount + 1);
      } catch (refreshError) {
        // If refresh fails, clear authentication and throw error
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isLoggedIn');
        
        // Propagate the error to all waiting requests
        waitingRequests.forEach(req => req.reject(refreshError));
        waitingRequests.length = 0;
        
        throw refreshError;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
        
        // Process any waiting requests
        const currentToken = localStorage.getItem('authToken');
        if (currentToken) {
          waitingRequests.forEach(req => {
            req.resolve(fetchApi(req.endpoint, req.options, retryCount + 1));
          });
          waitingRequests.length = 0;
        }
      }
    }
    
    return await handleApiResponse(response);
  } catch (error) {
    // Add status code for network errors
    if (!error.status) {
      error.status = 0;
      error.message = error.message || 'Network error. Please check your internet connection.';
    }
    
    throw error;
  }
};

// Auth API functions with timeout handling
export const loginUser = async (email, password) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    if (error.name === 'AbortError') {
      throw new Error('Login request timed out. Please try again.');
    }
    throw error;
  }
};

export const registerUser = async (userData) => {
  const formattedData = {
    name: userData.name,
    email: userData.email,
    password: userData.password,
    phone_number: userData.phone_number || '',
    date_of_birth: userData.date_of_birth || null,
  };
  
  return fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(formattedData),
  });
};

export const refreshTokenApi = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const data = await fetchApi('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    return data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

export const requestPasswordReset = async (email) => {
  return fetchApi('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async (token, newPassword) => {
  return fetchApi('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
};

// User profile functions with built-in error recovery
export const getUserProfile = async () => {
  try {
    return await fetchApi('/users/profile');
  } catch (error) {
    // If unauthorized, try to refresh token once automatically
    if (error.status === 401) {
      try {
        await refreshTokenApi();
        return await fetchApi('/users/profile');
      } catch (refreshError) {
        throw refreshError;
      }
    }
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  return fetchApi('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const updateUserSettings = async (settings) => {
  return fetchApi('/users/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
};

export const changePassword = async (oldPassword, newPassword) => {
  return fetchApi('/users/change-password', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
};

// Asset/Investment functions
export const getAssets = async () => {
  try {
    const response = await fetchApi('/assets');
    return response || [];
  } catch (error) {
    console.error('Error fetching assets:', error);
    // Return empty array instead of throwing to prevent UI breakage
    return [];
  }
};

export const getAssetById = async (assetId) => {
  return fetchApi(`/assets/${assetId}`);
};

export const getAssetsByType = async (assetType) => {
  return fetchApi(`/assets/types/${assetType}`);
};

export const createAsset = async (assetData) => {
  return fetchApi('/assets', {
    method: 'POST',
    body: JSON.stringify(assetData),
  });
};

export const updateAsset = async (assetId, assetData) => {
  return fetchApi(`/assets/${assetId}`, {
    method: 'PUT',
    body: JSON.stringify(assetData),
  });
};

export const updateAssetValue = async (assetId, value, notes = '') => {
  return fetchApi(`/assets/${assetId}/value`, {
    method: 'PATCH',
    body: JSON.stringify({ value, notes }),
  });
};

export const deleteAsset = async (assetId) => {
  return fetchApi(`/assets/${assetId}`, {
    method: 'DELETE',
  });
};

export const getAssetHistory = async (assetId) => {
  try {
    const response = await fetchApi(`/assets/${assetId}/history`);
    return response || []; 
  } catch (error) {
    console.error(`Error fetching history for asset ${assetId}:`, error);
    return [];
  }
};

// Portfolio summary with error handling
export const getPortfolioSummary = async () => {
  try {
    return await fetchApi('/assets/summary');
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    // Return default empty data structure to prevent UI breakage
    return {
      total_value: 0,
      total_investment: 0,
      assets_by_type: {},
      asset_count: 0,
      average_return: 0,
      average_risk_score: 0,
      upcoming_maturities: [],
      last_updated: new Date().toISOString()
    };
  }
};

// Document functions
export const getDocuments = async () => {
  try {
    const response = await fetchApi('/documents');
    return response || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

export const getDocumentById = async (documentId) => {
  return fetchApi(`/documents/${documentId}`);
};

export const uploadDocument = async (formData) => {
  // Special handling for file uploads - don't use JSON content type
  const token = localStorage.getItem('authToken');
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for file uploads
    
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers,
      body: formData, // FormData for file upload
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return await handleApiResponse(response);
  } catch (error) {
    console.error('Document upload failed:', error);
    if (error.name === 'AbortError') {
      throw new Error('Upload timed out. The file may be too large or your connection is slow.');
    }
    throw error;
  }
};

export const updateDocument = async (documentId, documentData) => {
  return fetchApi(`/documents/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify(documentData),
  });
};

export const deleteDocument = async (documentId) => {
  return fetchApi(`/documents/${documentId}`, {
    method: 'DELETE',
  });
};

export const updateDocumentNomineeAccess = async (documentId, nomineeIds) => {
  return fetchApi(`/documents/${documentId}/nominee-access`, {
    method: 'PATCH',
    body: JSON.stringify({ nominee_ids: nomineeIds }),
  });
};

// Nominee functions with better error handling
export const getNominees = async () => {
  try {
    const response = await fetchApi('/nominees');
    return response || [];
  } catch (error) {
    console.error('Error fetching nominees:', error);
    return [];
  }
};

export const getNomineeById = async (nomineeId) => {
  return fetchApi(`/nominees/${nomineeId}`);
};

export const createNominee = async (nomineeData) => {
  return fetchApi('/nominees', {
    method: 'POST',
    body: JSON.stringify(nomineeData),
  });
};

export const updateNominee = async (nomineeId, nomineeData) => {
  return fetchApi(`/nominees/${nomineeId}`, {
    method: 'PUT',
    body: JSON.stringify(nomineeData),
  });
};

export const deleteNominee = async (nomineeId) => {
  return fetchApi(`/nominees/${nomineeId}`, {
    method: 'DELETE',
  });
};

export const sendNomineeInvitation = async (nomineeId) => {
  const response = await fetchApi(`/nominees/${nomineeId}/send-invitation`, {
    method: 'POST',
  });
  
  return response && response.code ? response.code : 'CODE-NOT-FOUND';
};

export const getNomineeAccessLogs = async () => {
  try {
    const response = await fetchApi('/nominees/access-log');
    return response || [];
  } catch (error) {
    console.error('Error fetching nominee access logs:', error);
    return [];
  }
};

// Alert functions
export const getAlerts = async (includeRead = false) => {
  try {
    const response = await fetchApi(`/alerts?include_read=${includeRead}`);
    return response || [];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

export const markAlertAsRead = async (alertId) => {
  return fetchApi(`/alerts/${alertId}/read`, {
    method: 'PATCH',
  });
};

// While the backend doesn't have this endpoint, we'll assume it will
export const dismissAlert = async (alertId) => {
  return fetchApi(`/alerts/${alertId}`, {
    method: 'DELETE',
  });
};

// Dashboard data
export const getDashboardSummary = async () => {
  return getPortfolioSummary(); 
};

// Removed duplicate declaration of emergencyLogin

export const getEmergencyData = async (userId) => {
  try {
    const token = localStorage.getItem('emergencyAccessToken');
    if (!token) {
      throw new Error('No emergency access token found');
    }
    
    const response = await fetch(`/api/v1/nominee-access/data/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch emergency data (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching emergency data:', error);
    throw error;
  }
};

// src/utils/api.js - Updated emergencyLogin function

export const emergencyLogin = async (email, accessCode) => {
  try {
    // Call emergency access endpoint directly
    const response = await fetch('/api/v1/auth/emergency-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        emergency_access_code: accessCode
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Emergency access failed (${response.status})`);
    }
    
    // Parse response data (which now contains all the needed information)
    const data = await response.json();
    
    // Store token for any potential future API requests
    if (data.access_token) {
      localStorage.setItem('emergencyAccessToken', data.access_token);
    }
    
    // Return complete data object directly
    return data;
  } catch (error) {
    console.error('Emergency access error:', error);
    throw error;
  }
};

// Export all functions
export default {
  // Auth
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  refreshTokenApi,
  
  // User
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  changePassword,
  
  // Assets/Investments
  getAssets,
  getAssetById,
  getAssetsByType,
  createAsset,
  updateAsset,
  updateAssetValue,
  deleteAsset,
  getAssetHistory,
  getPortfolioSummary,
  
  // Documents
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  updateDocumentNomineeAccess,
  
  // Nominees
  getNominees,
  getNomineeById,
  createNominee,
  updateNominee,
  deleteNominee,
  sendNomineeInvitation,
  getNomineeAccessLogs,
  
  // Alerts
  getAlerts,
  markAlertAsRead,
  dismissAlert,
  
  // Dashboard
  getDashboardSummary,

  emergencyLogin,
};