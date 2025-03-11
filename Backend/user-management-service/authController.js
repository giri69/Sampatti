const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./userModel');
const connectDb = require('./dbConnection');
const crypto = require('crypto');

const withDbConnection = async (operation) => {
  await connectDb();
  return operation();
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

const generateRecoveryWords = () => {
  const wordList = [
    'apple', 'banana', 'carrot', 'diamond', 'elephant', 'forest',
    'guitar', 'horizon', 'island', 'jacket', 'kitchen', 'lemon',
    'mountain', 'notebook', 'orange', 'pencil', 'quantum', 'river',
    'sunset', 'turtle', 'umbrella', 'violet', 'window', 'xylophone',
    'yellow', 'zebra', 'airplane', 'balloon', 'candle', 'dolphin',
    'eagle', 'fountain', 'glacier', 'harbor', 'igloo', 'jungle',
    'kangaroo', 'lighthouse', 'meadow', 'nebula', 'octopus', 'penguin',
    'quasar', 'rainbow', 'satellite', 'telescope', 'unicorn', 'volcano',
    'waterfall', 'xenon', 'yacht', 'zeppelin'
  ];
  
  const shuffled = [...wordList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6);
};

exports.signup = async (userData) => {
  return withDbConnection(async () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'phoneNumber'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        const error = new Error(`${field} is required`);
        error.statusCode = 400;
        throw error;
      }
    }
    
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      const error = new Error('Email already in use');
      error.statusCode = 409;
      throw error;
    }
    
    const recoveryWords = generateRecoveryWords();
    const recoveryWordsHash = await bcrypt.hash(recoveryWords.join(' '), 10);
    
    const user = new User({
      ...userData,
      recoveryWordsHash,
      status: 'active'
    });
    
    await user.save();
    
    const token = generateToken(user._id);
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.recoveryWordsHash;
    
    return {
      message: 'Signup successful',
      token,
      user: userResponse,
      recoveryWords
    };
  });
};

exports.login = async (loginData) => {
  return withDbConnection(async () => {
    const { email, password } = loginData;
    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }
    
    if (user.status !== 'active') {
      const error = new Error('Account is not active');
      error.statusCode = 403;
      throw error;
    }
    
    if (user.accountLocked && user.lockUntil > Date.now()) {
      const error = new Error('Account is locked. Please try again later.');
      error.statusCode = 403;
      throw error;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      user.loginAttempts += 1;
      
      if (user.loginAttempts >= 5) {
        user.accountLocked = true;
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      
      await user.save();
      
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }
    
    user.loginAttempts = 0;
    user.accountLocked = false;
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    await user.save();
    
    const token = generateToken(user._id);
    
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.recoveryWordsHash;
    
    return {
      message: 'Login successful',
      token,
      user: userResponse
    };
  });
};

exports.verifyRecoveryWords = async (recoveryData) => {
  return withDbConnection(async () => {
    const { email, recoveryWords } = recoveryData;
    
    if (!email || !recoveryWords || !Array.isArray(recoveryWords) || recoveryWords.length !== 6) {
      const error = new Error('Email and 6 recovery words are required');
      error.statusCode = 400;
      throw error;
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    const isWordsValid = await bcrypt.compare(recoveryWords.join(' '), user.recoveryWordsHash);
    if (!isWordsValid) {
      const error = new Error('Invalid recovery words');
      error.statusCode = 401;
      throw error;
    }
    
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    
    return {
      message: 'Recovery words verified successfully',
      resetToken: passwordResetToken
    };
  });
};

exports.resetPassword = async (resetData) => {
  return withDbConnection(async () => {
    const { email, token, newPassword } = resetData;
    
    if (!email || !token || !newPassword) {
      const error = new Error('Email, token, and new password are required');
      error.statusCode = 400;
      throw error;
    }
    
    const user = await User.findOne({
      email,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      const error = new Error('Invalid or expired reset token');
      error.statusCode = 400;
      throw error;
    }
    
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    return {
      message: 'Password reset successful. Please log in with your new password.'
    };
  });
};

exports.verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password -recoveryWordsHash');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }
    
    if (user.status !== 'active') {
      const error = new Error('User account is not active');
      error.statusCode = 403;
      throw error;
    }
    
    user.lastActivity = new Date();
    await user.save();
    
    return user;
  } catch (error) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }
};
