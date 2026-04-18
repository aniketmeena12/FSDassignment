import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin,
  validateChangePassword,
} from '../validators/validators.js';

const router = express.Router();

/**
 * Public routes
 */
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

/**
 * Protected routes
 */
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, validateChangePassword, authController.changePassword);

export default router;
