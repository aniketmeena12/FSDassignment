import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/auth.js';
import { generateToken } from '../utils/jwt.js';
import AppError from '../utils/appError.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';

/**
 * Register a new user
 */
export const registerUser = async (email, password, name) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(
      'User already exists with this email.',
      HTTP_STATUS.CONFLICT
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create new user
  const user = new User({
    email,
    password: hashedPassword,
    name,
    role: ROLES.USER,
  });

  await user.save();

  // Generate JWT token
  const token = generateToken(user._id.toString(), user.role);

  return {
    token,
    user: user.toJSON(),
  };
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
  // Find user and select password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError(
      'Invalid email or password.',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError(
      'Your account has been deactivated.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(
      'Invalid email or password.',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Generate JWT token
  const token = generateToken(user._id.toString(), user.role);

  return {
    token,
    user: user.toJSON(),
  };
};

/**
 * Get current user
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updateData) => {
  // Prevent role change from here
  delete updateData.role;

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

/**
 * Change user password
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Verify old password
  const isPasswordValid = await comparePassword(oldPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError(
      'Current password is incorrect.',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Hash new password
  user.password = await hashPassword(newPassword);
  await user.save();

  return { message: 'Password changed successfully.' };
};
