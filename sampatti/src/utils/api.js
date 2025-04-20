const API_BASE_URL = '/api/v1';

const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    // Debug logging - can be removed in production
    console.log('Using auth token:', token.substring(0, 10) + '...');
  } else {
    console.log('No auth token found');
  }

  const config = {
    ...options,
    headers,
  };

  try {
    console.log(`Requesting: ${url}`, { 
      method: options.method || 'GET',
      headers: { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'none' }
    });
    
    const response = await fetch(url, config);
    
    const contentType = response.headers.get('content-type');
    
    console.log(`Response status: ${response.status}`, 
                `Content-Type: ${contentType}`,
                response.ok ? 'Success' : 'Failed');
    
    // Enhanced error handling
    if (!response.ok) {
      let errorMessage;
      let errorDetails = {};
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP error ${response.status}`;
          errorDetails = errorData;
        } else {
          errorMessage = await response.text() || `HTTP error ${response.status}`;
        }
      } catch (parseError) {
        errorMessage = `HTTP error ${response.status}`;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('API request failed:', error);
    // Enrich error with additional context
    if (!error.status) {
      error.status = 0; // Network error
      error.message = error.message || 'Network error. Please check your connection.';
    }
    
    // Special handling for auth errors (401)
    if (error.status === 401) {
      // Could add token refresh logic here
      console.warn('Authentication error, token may be invalid or expired');
    }
    
    throw error;
  }
};

// Authentication functions
// Updated loginUser function in api.js
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    // Handle server errors
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Login failed (${response.status})`);
      } else {
        throw new Error(`Login failed (${response.status})`);
      }
    }
    
    // Parse response
    const data = await response.json();
    
    // Check for expected data structure
    if (!data.access_token) {
      throw new Error('Invalid response from server');
    }
    
    // If the server doesn't return user info, we'll fetch it
    if (!data.user && data.access_token) {
      try {
        // Set the token temporarily to fetch user data
        localStorage.setItem('authToken', data.access_token);
        const userData = await getUserProfile();
        // Combine the token and user data
        return {
          ...data,
          user: userData
        };
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Return just the token info if profile fetch fails
        return data;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Login API error:', error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  const formattedData = {
    name: userData.name,
    email: userData.email,
    password: userData.password,
    phone_number: userData.phone_number || '',
  };
  
  if (userData.date_of_birth) {
    formattedData.date_of_birth = userData.date_of_birth;
  }
  
  const response = await fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(formattedData),
  });
  
  console.log('Registration response:', response);
  return response;
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

// User profile functions
export const getUserProfile = async () => {
  return fetchApi('/users/profile', {
    method: 'GET',
  });
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

// Dashboard and summary functions
export const getDashboardSummary = async () => {
  return fetchApi('/assets/summary', {
    method: 'GET',
  });
};

// Asset functions
export const getAssets = async () => {
  return fetchApi('/assets', {
    method: 'GET',
  });
};

export const getAssetById = async (assetId) => {
  return fetchApi(`/assets/${assetId}`, {
    method: 'GET',
  });
};

export const getAssetHistory = async (assetId) => {
  return fetchApi(`/assets/${assetId}/history`, {
    method: 'GET',
  });
};

export const getAssetsByType = async (assetType) => {
  return fetchApi(`/assets/types/${assetType}`, {
    method: 'GET',
  });
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

export const updateAssetValue = async (assetId, value, notes) => {
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

// Document functions
export const getDocuments = async () => {
  return fetchApi('/documents', {
    method: 'GET',
  });
};

export const getDocumentById = async (documentId) => {
  return fetchApi(`/documents/${documentId}`, {
    method: 'GET',
  });
};

export const uploadDocument = async (formData) => {
  // Note: This function needs special handling for file uploads
  const url = `${API_BASE_URL}/documents`;
  
  const headers = {};
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
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
  return fetchApi('/nominees', {
    method: 'GET',
  });
};

export const getNomineeById = async (nomineeId) => {
  return fetchApi(`/nominees/${nomineeId}`, {
    method: 'GET',
  });
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
  return fetchApi('/nominees/access-log', {
    method: 'GET',
  });
};

// Alert functions
export const getAlerts = async (includeRead = false) => {
  return fetchApi(`/alerts?include_read=${includeRead}`, {
    method: 'GET',
  });
};

export const markAlertAsRead = async (alertId) => {
  return fetchApi(`/alerts/${alertId}/read`, {
    method: 'PATCH',
  });
};

// Export all functions as a default object
export default {
  // Auth
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  
  // User
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  changePassword,
  
  // Dashboard
  getDashboardSummary,
  
  // Assets
  getAssets,
  getAssetById,
  getAssetHistory,
  getAssetsByType,
  createAsset,
  updateAsset,
  updateAssetValue,
  deleteAsset,
  
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
  markAlertAsRead
};