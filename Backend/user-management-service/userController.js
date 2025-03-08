 const User = require('./userModel');
const connectDb = require('./dbConnection');
 
const withDbConnection = async (operation) => {
  await connectDb();
  return operation();
};

exports.getAllUsers = async () => {
  return withDbConnection(async () => {
    const users = await User.find({}).select('-password');
    return { users };
  });
};

exports.getUserById = async (userId) => {
  return withDbConnection(async () => {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    return { user };
  });
};

exports.createUser = async (userData) => {
  return withDbConnection(async () => {
    // Check if user already exists
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
    
    return { 
      message: 'User created successfully',
      user: userResponse
    };
  });
};

exports.updateUser = async (userId, userData) => {
  return withDbConnection(async () => {
    const user = await User.findByIdAndUpdate(
      userId,
      userData,
      { new: true, runValidators: true }
    ).select('-password');
    
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
