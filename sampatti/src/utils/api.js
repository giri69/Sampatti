// src/utils/api.js
const API_BASE_URL = '/api/v1';

// Generic API fetching function with authentication and error handling
const fetchApi = async (endpoint, options = {}) => {
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
    
    // Check if response is empty
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
  } catch (error) {
    // Add status code for network errors
    if (!error.status) {
      error.status = 0;
      error.message = error.message || 'Network error. Please check your connection.';
    }
    
    throw error;
  }
};

// Auth API functions
export const loginUser = async (email, password) => {
  try {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    return data;
  } catch (error) {
    console.error('Login failed:', error);
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

export const refreshAuthToken = async (refreshToken) => {
  return fetchApi('/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
};

// User profile functions
export const getUserProfile = async () => {
  return fetchApi('/users/profile');
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
  return fetchApi('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
};

// Asset/Investment functions
export const getAssets = async () => {
  return fetchApi('/assets');
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
  return fetchApi(`/assets/${assetId}/history`);
};

// Portfolio summary
export const getPortfolioSummary = async () => {
  return fetchApi('/assets/summary');
};

// Document functions
export const getDocuments = async () => {
  return fetchApi('/documents');
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
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers,
      body: formData, // FormData for file upload
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Document upload failed:', error);
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

// Nominee functions
export const getNominees = async () => {
  return fetchApi('/nominees');
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
  return fetchApi(`/nominees/${nomineeId}/send-invitation`, {
    method: 'POST',
  });
};

export const getNomineeAccessLogs = async () => {
  return fetchApi('/nominees/access-log');
};

// Alert functions
export const getAlerts = async (includeRead = false) => {
  return fetchApi(`/alerts?include_read=${includeRead}`);
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
  return getPortfolioSummary(); // Dashboard summary is the same as portfolio summary
};

// Export all functions
export default {
  // Auth
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  refreshAuthToken,
  
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
};