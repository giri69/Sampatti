
const User = require('./userModel');
const { verifyToken } = require('./authController');
const connectDb = require('./dbConnection');

const withDbConnection = async (operation) => {
  await connectDb();
  return operation();
};

exports.getAllUsers = async () => {
  return withDbConnection(async () => {
    const users = await User.find({}).select('-password -recoveryWordsHash');
    return { users };
  });
};

exports.getUserById = async (userId) => {
  return withDbConnection(async () => {
    const user = await User.findById(userId).select('-password -recoveryWordsHash');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    return { user };
  });
};

exports.getUserProfile = async (token) => {
  return withDbConnection(async () => {
    const user = await verifyToken(token);
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.recoveryWordsHash;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;
    
    return { profile: userResponse };
  });
};

exports.createUser = async (userData) => {
  return withDbConnection(async () => {
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }
    
    const user = new User(userData);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.recoveryWordsHash;
    
    return { 
      message: 'User created successfully',
      user: userResponse
    };
  });
};

exports.updateUser = async (userId, userData) => {
  return withDbConnection(async () => {
    if (userData.password) {
      delete userData.password;
    }
    
    if (userData.recoveryWordsHash) {
      delete userData.recoveryWordsHash;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      userData,
      { new: true, runValidators: true }
    ).select('-password -recoveryWordsHash');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    return { 
      message: 'User updated successfully',
      user
    };
  });
};

exports.updateUserProfile = async (token, profileData) => {
  return withDbConnection(async () => {
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
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.recoveryWordsHash;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetExpires;
    
    return { 
      message: 'Profile updated successfully',
      profile: userResponse
    };
  });
};

exports.deleteUser = async (userId) => {
  return withDbConnection(async () => {
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    return { message: 'User deleted successfully' };
  });
};
