import asyncHandler from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';

/**
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role } = req.query;

  const filters = {};
  if (search) filters.search = search;
  if (role) filters.role = role;

  const result = await userService.getAllUsers(page, limit, filters);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
  });
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user,
  });
});

/**
 * Create user (Admin only)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  const user = await userService.createUser({
    email,
    password,
    name,
    role,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED,
    data: user,
  });
});

/**
 * Update user (Admin only)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED,
    data: user,
  });
});

/**
 * Delete user (Admin only)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await userService.deleteUser(req.params.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED,
    data: user,
  });
});

/**
 * Bulk operations on users
 */
export const bulkUpdateUsers = asyncHandler(async (req, res) => {
  const { userIds, updateData } = req.body;

  const result = await userService.bulkUpdateUsers(userIds, updateData);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Users updated successfully',
    data: result,
  });
});
