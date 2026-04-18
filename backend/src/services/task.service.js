import Task from '../models/Task.js';
import AppError from '../utils/appError.js';
import { HTTP_STATUS, TASK_STATUS } from '../config/constants.js';
import fs from 'fs';
import path from 'path';

/**
 * Create a new task
 */
export const createTask = async (taskData, userId) => {
  taskData.createdBy = userId;

  if (!taskData.assignedTo) {
    taskData.assignedTo = userId;
  }

  const task = new Task(taskData);
  await task.save();

  return task;
};

/**
 * Get all tasks with filtering, sorting, and pagination
 */
export const getAllTasks = async (page = 1, limit = 10, filters = {}, userId, userRole) => {
  const skip = (page - 1) * limit;

  // Build filter query
  const query = {};

  // If user is not admin, only show their tasks
  if (userRole !== 'admin') {
    query.$or = [
      { createdBy: userId },
      { assignedTo: userId },
    ];
  }

  // Apply status filter
  if (filters.status) {
    query.status = filters.status;
  }

  // Apply priority filter
  if (filters.priority) {
    query.priority = filters.priority;
  }

  // Apply search filter
  if (filters.search) {
    query.$or = query.$or || [];
    query.$or.push(
      { title: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') }
    );
  }

  // Apply date range filter
  if (filters.dueDateFrom || filters.dueDateTo) {
    query.dueDate = {};
    if (filters.dueDateFrom) {
      query.dueDate.$gte = new Date(filters.dueDateFrom);
    }
    if (filters.dueDateTo) {
      query.dueDate.$lte = new Date(filters.dueDateTo);
    }
  }

  // Build sort query
  let sortQuery = {};
  if (filters.sortBy) {
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
    sortQuery[filters.sortBy] = sortOrder;
  } else {
    sortQuery = { createdAt: -1 };
  }

  const tasks = await Task.find(query)
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(query);

  return {
    tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get task by ID
 */
export const getTaskById = async (taskId, userId, userRole) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Check authorization
  const createdByStr = task.createdBy.toString();
  const assignedToStr = task.assignedTo.toString();
  
  if (
    userRole !== 'admin' &&
    createdByStr !== userId &&
    assignedToStr !== userId
  ) {
    console.error(`[DEBUG] Permission denied for task ${taskId}:`, {
      userId,
      userRole,
      createdBy: createdByStr,
      assignedTo: assignedToStr,
    });
    throw new AppError(
      'You do not have permission to view this task.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  return task;
};

/**
 * Update task
 */
export const updateTask = async (taskId, updateData, userId, userRole) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Check authorization
  if (userRole !== 'admin' && task.createdBy.toString() !== userId) {
    throw new AppError(
      'You can only update tasks you created.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  // If task is being marked as completed, set completedAt
  if (
    updateData.status === TASK_STATUS.COMPLETED &&
    task.status !== TASK_STATUS.COMPLETED
  ) {
    updateData.completedAt = new Date();
  } else if (updateData.status !== TASK_STATUS.COMPLETED) {
    updateData.completedAt = null;
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, {
    new: true,
    runValidators: true,
  });

  return updatedTask;
};

/**
 * Delete task
 */
export const deleteTask = async (taskId, userId, userRole) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Check authorization
  if (userRole !== 'admin' && task.createdBy.toString() !== userId) {
    throw new AppError(
      'You can only delete tasks you created.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Delete attached files
  if (task.documents && task.documents.length > 0) {
    task.documents.forEach((doc) => {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (error) {
        console.error(`Failed to delete file: ${doc.filePath}`, error);
      }
    });
  }

  await Task.findByIdAndDelete(taskId);

  return { message: 'Task deleted successfully.' };
};

/**
 * Add document to task
 */
export const addDocumentToTask = async (taskId, file, userId, userRole) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Check authorization
  if (userRole !== 'admin' && task.createdBy.toString() !== userId) {
    throw new AppError(
      'You do not have permission to modify this task.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Check if max files limit reached
  const maxFiles = parseInt(process.env.MAX_FILES_PER_TASK) || 3;
  if (task.documents.length >= maxFiles) {
    throw new AppError(
      `You can only upload up to ${maxFiles} documents per task.`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const document = {
    fileName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
  };

  task.documents.push(document);
  await task.save();

  return task;
};

/**
 * Delete document from task
 */
export const deleteDocumentFromTask = async (
  taskId,
  documentId,
  userId,
  userRole
) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Check authorization
  if (userRole !== 'admin' && task.createdBy.toString() !== userId) {
    throw new AppError(
      'You do not have permission to modify this task.',
      HTTP_STATUS.FORBIDDEN
    );
  }

  const document = task.documents.id(documentId);

  if (!document) {
    throw new AppError('Document not found.', HTTP_STATUS.NOT_FOUND);
  }

  // Delete file from disk
  try {
    fs.unlinkSync(document.filePath);
  } catch (error) {
    console.error(`Failed to delete file: ${document.filePath}`, error);
  }

  task.documents.id(documentId).deleteOne();
  await task.save();

  return task;
};

/**
 * Get task statistics
 */
export const getTaskStatistics = async (userId, userRole) => {
  const query = userRole === 'admin'
    ? {}
    : {
        $or: [
          { createdBy: userId },
          { assignedTo: userId },
        ],
      };

  const stats = await Task.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const formattedStats = {
    pending: 0,
    in_progress: 0,
    completed: 0,
  };

  stats.forEach((stat) => {
    formattedStats[stat._id] = stat.count;
  });

  return formattedStats;
};
