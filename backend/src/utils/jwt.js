import jwt from 'jsonwebtoken';
import AppError from './appError.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Generate JWT Token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT Token
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify JWT Token
 * @param {string} token - JWT Token
 * @returns {Object} Decoded token
 * @throws {AppError} If token is invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch (error) {
    throw new AppError(
      'Invalid or expired token',
      HTTP_STATUS.UNAUTHORIZED
    );
  }
};
