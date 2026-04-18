const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthService = require('../../src/services/authService');
const User = require('../../src/models/User');

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty('_id');
      expect(result.email).toBe(userData.email);
      expect(result.password).not.toBe(userData.password); // Password should be hashed
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await AuthService.register(userData);

      await expect(AuthService.register(userData)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      await expect(AuthService.register(userData)).rejects.toThrow();
    });

    it('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too short
        name: 'Test User',
      };

      await expect(AuthService.register(userData)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await AuthService.register({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    it('should return token for valid credentials', async () => {
      const result = await AuthService.login(
        'user@example.com',
        'password123'
      );

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('user@example.com');
    });

    it('should throw error for non-existent email', async () => {
      await expect(
        AuthService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for incorrect password', async () => {
      await expect(
        AuthService.login('user@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('verifyToken', () => {
    it('should return decoded token for valid token', async () => {
      const user = await AuthService.register({
        email: 'verify@example.com',
        password: 'password123',
        name: 'Test User',
      });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      const decoded = AuthService.verifyToken(token);

      expect(decoded).toHaveProperty('id');
      expect(decoded.id).toBe(user._id.toString());
    });

    it('should throw error for invalid token', () => {
      expect(() => AuthService.verifyToken('invalid.token')).toThrow();
    });
  });
});
