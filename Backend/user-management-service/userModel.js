const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required for verification'],
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Please provide a valid 10-digit phone number'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  recoveryWordsHash: {
    type: String,
    required: true
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  identityVerified: {
    type: Boolean,
    default: false
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  recoveryEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    assetUpdates: {
      type: Boolean,
      default: true
    }
  },
  language: {
    type: String,
    default: 'en'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLogin: {
    type: Date
  },
  lastActivity: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
