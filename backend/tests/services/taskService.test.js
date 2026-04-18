const TaskService = require('../../src/services/taskService');
const Task = require('../../src/models/Task');
const User = require('../../src/models/User');

describe('TaskService', () => {
  let user, adminUser, task;

  beforeEach(async () => {
    user = await User.create({
      email: 'user@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'user',
    });

    adminUser = await User.create({
      email: 'admin@example.com',
      password: 'password123',
      name: 'Admin User',
      role: 'admin',
    });

    task = await Task.create({
      title: 'Test Task',
      description: 'Test Description',
      status: 'pending',
      priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: user._id,
      assignedTo: user._id,
    });
  });

  describe('getTasks', () => {
    it('should return user tasks for non-admin', async () => {
      const result = await TaskService.getTasks(user._id, false, 1, 10);

      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('total');
      expect(result.tasks.every((t) => t.assignedTo.toString() === user._id.toString())).toBe(true);
    });

    it('should return all tasks for admin', async () => {
      const result = await TaskService.getTasks(adminUser._id, true, 1, 10);

      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('total');
    });

    it('should filter tasks by status', async () => {
      const result = await TaskService.getTasks(user._id, false, 1, 10, '', {
        status: 'pending',
      });

      expect(result.tasks.every((t) => t.status === 'pending')).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const result = await TaskService.getTasks(user._id, false, 1, 10, '', {
        priority: 'high',
      });

      expect(result.tasks.every((t) => t.priority === 'high')).toBe(true);
    });

    it('should sort tasks by due date', async () => {
      const result = await TaskService.getTasks(
        user._id,
        false,
        1,
        10,
        'dueDate'
      );

      const dates = result.tasks.map((t) => t.dueDate.getTime());
      expect(dates).toEqual([...dates].sort((a, b) => a - b));
    });
  });

  describe('getTaskById', () => {
    it('should return task by id', async () => {
      const foundTask = await TaskService.getTaskById(task._id);

      expect(foundTask._id).toEqual(task._id);
      expect(foundTask.title).toBe(task.title);
    });

    it('should throw error for non-existent task', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(TaskService.getTaskById(fakeId)).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('createTask', () => {
    it('should create new task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'New Description',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assignedTo: user._id,
      };

      const newTask = await TaskService.createTask(user._id, taskData);

      expect(newTask.title).toBe(taskData.title);
      expect(newTask.createdBy.toString()).toBe(user._id.toString());
    });

    it('should throw error for invalid status', async () => {
      const taskData = {
        title: 'New Task',
        description: 'New Description',
        status: 'invalid',
        priority: 'medium',
        dueDate: new Date(),
        assignedTo: user._id,
      };

      await expect(
        TaskService.createTask(user._id, taskData)
      ).rejects.toThrow();
    });
  });

  describe('updateTask', () => {
    it('should update task data', async () => {
      const updateData = {
        title: 'Updated Title',
        status: 'in_progress',
      };

      const updatedTask = await TaskService.updateTask(
        task._id,
        user._id,
        false,
        updateData
      );

      expect(updatedTask.title).toBe(updateData.title);
      expect(updatedTask.status).toBe(updateData.status);
    });

    it('should throw error if user is not creator or admin', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
      });

      const updateData = { title: 'Updated Title' };

      await expect(
        TaskService.updateTask(task._id, otherUser._id, false, updateData)
      ).rejects.toThrow('Not authorized to update this task');
    });
  });

  describe('deleteTask', () => {
    it('should delete task', async () => {
      await TaskService.deleteTask(task._id, user._id, false);

      await expect(TaskService.getTaskById(task._id)).rejects.toThrow(
        'Task not found'
      );
    });

    it('should throw error if user is not creator or admin', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
      });

      await expect(
        TaskService.deleteTask(task._id, otherUser._id, false)
      ).rejects.toThrow('Not authorized to delete this task');
    });
  });
});
