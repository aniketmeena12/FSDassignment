import express from 'express';
import * as taskController from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validatePagination,
} from '../validators/validators.js';

const router = express.Router();

/**
 * All task routes are protected
 */
router.use(authenticate);

/**
 * Task CRUD routes
 */
router.post('/', validateCreateTask, taskController.createTask);
router.get('/', validatePagination, taskController.getAllTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/:id', taskController.getTaskById);
router.put('/:id', validateUpdateTask, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

/**
 * Document routes
 */
router.post('/:id/documents', upload.single('document'), taskController.uploadDocument);
router.delete('/:taskId/documents/:documentId', taskController.deleteDocument);

export default router;
