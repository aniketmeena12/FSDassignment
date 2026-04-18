import asyncHandler from '../utils/asyncHandler.js';
import * as taskService from '../services/task.service.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';

/**
 * Create task
 */
export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user.id);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED,
    data: task,
  });
});

/**
 * Get all tasks with filters
 */
export const getAllTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, search, sortBy, sortOrder, dueDateFrom, dueDateTo } = req.query;

  const filters = {
    status,
    priority,
    search,
    sortBy,
    sortOrder,
    dueDateFrom,
    dueDateTo,
  };

  const result = await taskService.getAllTasks(
    page,
    limit,
    filters,
    req.user.id,
    req.user.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
  });
});

/**
 * Get task by ID
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(
    req.params.id,
    req.user.id,
    req.user.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: task,
  });
});

/**
 * Update task
 */
export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.id,
    req.body,
    req.user.id,
    req.user.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED,
    data: task,
  });
});

/**
 * Delete task
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(
    req.params.id,
    req.user.id,
    req.user.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: result.message,
  });
});

/**
 * Upload document to task
 */
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const task = await taskService.addDocumentToTask(
    req.params.id,
    req.file,
    req.user.id,
    req.user.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Document uploaded successfully',
    data: task,
  });
});

/**
 * Delete document from task
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const { taskId, documentId } = req.params;

  const task = await taskService.deleteDocumentFromTask(
    taskId,
    documentId,
    req.user.id,
    req.user.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Document deleted successfully',
    data: task,
  });
});

/**
 * Get task statistics
 */
export const getTaskStats = asyncHandler(async (req, res) => {
  const stats = await taskService.getTaskStatistics(
    req.user.id,
    req.user.role
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats,
  });
});
