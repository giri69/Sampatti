const User = require('./userModel');
const { verifyToken } = require('./authController');
 
exports.getAllUsers = async () => {
  const users = await User.find();
   
  const sanitizedUsers = users.map(user => {
    const userObj = { ...user };
    delete userObj.password;
    delete userObj.recoveryWordsHash;
    return userObj;
  });
  
  return { users: sanitizedUsers };
};
 
exports.getUserById = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
   const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.recoveryWordsHash;
  
  return { user: userResponse };
};
 
exports.getUserProfile = async (token) => {
  const user = await verifyToken(token);
  
  const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.recoveryWordsHash;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetExpires;
  
  return { profile: userResponse };
};
 
exports.createUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
  
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 409;
    throw error;
  }
  
  // Hash password if it exists
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }
  
  const user = await User.create(userData);
  
  const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.recoveryWordsHash;
  
  return { 
    message: 'User created successfully',
    user: userResponse
  };
};

/**
 * Update a user by ID
 * @param {string|number} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user object
 */
exports.updateUser = async (userId, userData) => {
  // Don't allow updating password or recovery words through this endpoint
  if (userData.password) {
    delete userData.password;
  }
  
  if (userData.recoveryWordsHash) {
    delete userData.recoveryWordsHash;
  }
  
  const user = await User.findByIdAndUpdate(userId, userData);
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
  const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.recoveryWordsHash;
  
  return { 
    message: 'User updated successfully',
    user: userResponse
  };
};
 
exports.updateUserProfile = async (token, profileData) => {
  const user = await verifyToken(token);
  
  const allowedUpdates = [
    'firstName', 
    'lastName', 
    'phoneNumber', 
    'dateOfBirth', 
    'address', 
    'language',
    'recoveryEmail',
    'notificationPreferences'
  ];
  
  const filteredData = {};
  for (const key of allowedUpdates) {
    if (key in profileData) {
      filteredData[key] = profileData[key];
    }
  }
  
   Object.assign(user, filteredData);
  user.updatedAt = new Date();
  
  await User.save(user);
  
  const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.recoveryWordsHash;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetExpires;
  
  return { 
    message: 'Profile updated successfully',
    profile: userResponse
  };
};
 
exports.deleteUser = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
  return { message: 'User deleted successfully' };
};