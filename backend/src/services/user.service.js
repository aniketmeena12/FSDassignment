import User from '../models/User.js';
import { hashPassword } from '../utils/auth.js';
import AppError from '../utils/appError.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;

  // Build filter query
  const query = {};
  if (filters.search) {
    query.$or = [
      { name: new RegExp(filters.search, 'i') },
      { email: new RegExp(filters.search, 'i') },
    ];
  }
  if (filters.role) {
    query.role = filters.role;
  }

  const users = await User.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

/**
 * Create user (Admin only)
 */
export const createUser = async (userData) => {
  const { email, password, name, role } = userData;

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

  const user = new User({
    email,
    password: hashedPassword,
    name,
    role: role || 'user',
  });

  await user.save();

  return user;
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (userId, updateData) => {
  // Don't allow direct password change through this endpoint
  delete updateData.password;

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
 * Delete user (Admin only)
 */
export const deleteUser = async (userId) => {
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

/**
 * Bulk update users (Admin only)
 */
export const bulkUpdateUsers = async (userIds, updateData) => {
  delete updateData.password;

  const result = await User.updateMany(
    { _id: { $in: userIds } },
    updateData,
    { runValidators: true }
  );

  return result;
};
