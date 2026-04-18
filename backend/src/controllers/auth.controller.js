import asyncHandler from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';

/**
 * Register endpoint
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const result = await authService.registerUser(email, password, name);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Registration successful',
    data: result,
  });
});

/**
 * Login endpoint
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    data: result,
  });
});

/**
 * Get current user endpoint
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user,
  });
});

/**
 * Update user profile endpoint
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, profileImage } = req.body;

  const user = await authService.updateUserProfile(req.user.id, {
    name,
    profileImage,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED,
    data: user,
  });
});

/**
 * Change password endpoint
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'New passwords do not match',
    });
  }

  const result = await authService.changePassword(
    req.user.id,
    oldPassword,
    newPassword
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: result.message,
  });
});
