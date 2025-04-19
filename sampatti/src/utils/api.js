const API_BASE_URL = '/api/v1';

const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    console.log(`Making request to: ${url}`, { method: options.method, body: options.body });
    
    const response = await fetch(url, config);
    
    const contentType = response.headers.get('content-type');
    
    console.log(`Response status: ${response.status}`, 
                `Content-Type: ${contentType}`,
                response.ok ? 'Success' : 'Failed');
    
    if (!response.ok) {
      let errorMessage;
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
      } else {
        errorMessage = await response.text() || `HTTP error ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
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

export default {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  getUserProfile,
  updateUserProfile,
};