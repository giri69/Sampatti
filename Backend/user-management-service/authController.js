const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('./userModel');

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
  const requiredFields = ['firstName', 'lastName', 'email', 'password', 'phoneNumber'];
  for (const field of requiredFields) {
    if (!userData[field]) {
      const error = new Error(`${field} is required`);
      error.statusCode = 400;
      throw error;
    }
  }
  
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
  if (existingUser) {
    const error = new Error('Email already in use');
    error.statusCode = 409;
    throw error;
  }
  
  const recoveryWords = generateRecoveryWords();
   
  const salt = await bcrypt.genSalt(10);
  userData.password = await bcrypt.hash(userData.password, salt);
  userData.recoveryWordsHash = await bcrypt.hash(recoveryWords.join(' '), salt);
  userData.status = 'active';
  
   const user = await User.create(userData);
  
   const token = generateToken(user.id);
  
   const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.recoveryWordsHash;
  
  return {
    message: 'Signup successful',
    token,
    user: userResponse,
    recoveryWords
  };
};
 
exports.login = async (loginData) => {
  const { email, password } = loginData;
  
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }
  
  const user = await User.findOne({ email: email.toLowerCase() });
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
  
  if (user.accountLocked && user.lockUntil > new Date()) {
    const error = new Error('Account is locked. Please try again later.');
    error.statusCode = 403;
    throw error;
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Update login attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    if (user.loginAttempts >= 5) {
      user.accountLocked = true;
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);  
    }
    
    await User.save(user);
    
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
   
  user.loginAttempts = 0;
  user.accountLocked = false;
  user.lastLogin = new Date();
  user.lastActivity = new Date();
  await User.save(user); 
  const token = generateToken(user.id);
   
  const userResponse = { ...user };
  delete userResponse.password;
  delete userResponse.recoveryWordsHash;
  
  return {
    message: 'Login successful',
    token,
    user: userResponse
  };
};
 
exports.verifyRecoveryWords = async (recoveryData) => {
  const { email, recoveryWords } = recoveryData;
  
  if (!email || !recoveryWords || !Array.isArray(recoveryWords) || recoveryWords.length !== 6) {
    const error = new Error('Email and 6 recovery words are required');
    error.statusCode = 400;
    throw error;
  }
  
  const user = await User.findOne({ email: email.toLowerCase() });
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
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await User.save(user);
  
  return {
    message: 'Recovery words verified successfully',
    resetToken: passwordResetToken
  };
};
 
exports.resetPassword = async (resetData) => {
  const { email, token, newPassword } = resetData;
  
  if (!email || !token || !newPassword) {
    const error = new Error('Email, token, and new password are required');
    error.statusCode = 400;
    throw error;
  }
  
   const user = await User.findOne({ 
    email: email.toLowerCase()
  });
  
  if (!user || user.passwordResetToken !== token || 
      !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    throw error;
  }
  
   const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await User.save(user);
  
  return {
    message: 'Password reset successful. Please log in with your new password.'
  };
};
 
exports.verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id);
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
    
    // Update last activity
    user.lastActivity = new Date();
    await User.save(user);
    
    return user;
  } catch (error) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }
};