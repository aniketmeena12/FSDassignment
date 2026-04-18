const request = require('supertest');
const app = require('../../src/index');
const User = require('../../src/models/User');
const Task = require('../../src/models/Task');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'password123',
        name: 'New User',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    it('should login user with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'user@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('Tasks API', () => {
  let token, userId;

  beforeEach(async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'user@example.com',
      password: 'password123',
      name: 'Test User',
    });

    token = response.body.token;
    userId = response.body.user._id;
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Task',
          description: 'Task Description',
          status: 'pending',
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(201);
      expect(response.body.task.title).toBe('New Task');
    });

    it('should return 401 without token', async () => {
      const response = await request(app).post('/api/tasks').send({
        title: 'New Task',
        description: 'Task Description',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Task',
          description: 'Description',
          status: 'pending',
          priority: 'high',
          dueDate: new Date(),
        });
    });

    it('should get user tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toBeInstanceOf(Array);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=pending')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(
        response.body.tasks.every((t) => t.status === 'pending')
      ).toBe(true);
    });
  });
});
