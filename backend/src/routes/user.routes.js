import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validatePagination,
} from '../validators/validators.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

/**
 * All user routes are protected
 */
router.use(authenticate);

/**
 * Public user routes (all authenticated users)
 */
router.get('/', validatePagination, userController.getAllUsers);
router.get('/:id', userController.getUserById);

/**
 * Admin only routes
 */
router.post('/', authorize(ROLES.ADMIN), validateCreateUser, userController.createUser);
router.put('/:id', authorize(ROLES.ADMIN), validateUpdateUser, userController.updateUser);
router.delete('/:id', authorize(ROLES.ADMIN), userController.deleteUser);
router.post('/bulk-update', authorize(ROLES.ADMIN), userController.bulkUpdateUsers);

export default router;
