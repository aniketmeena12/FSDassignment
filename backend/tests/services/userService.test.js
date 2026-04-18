const UserService = require('../../src/services/userService');
const User = require('../../src/models/User');

describe('UserService', () => {
  let adminUser, regularUser;

  beforeEach(async () => {
    adminUser = await User.create({
      email: 'admin@example.com',
      password: 'password123',
      name: 'Admin User',
      role: 'admin',
    });

    regularUser = await User.create({
      email: 'user@example.com',
      password: 'password123',
      name: 'Regular User',
      role: 'user',
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated list of users', async () => {
      const result = await UserService.getAllUsers(1, 10);

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result.users.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const result = await UserService.getAllUsers(1, 10, { role: 'admin' });

      expect(result.users.every((u) => u.role === 'admin')).toBe(true);
    });

    it('should sort users in specified order', async () => {
      const result = await UserService.getAllUsers(1, 10, {}, 'createdAt');

      expect(result.users[0].createdAt <= result.users[1].createdAt).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const user = await UserService.getUserById(adminUser._id);

      expect(user._id).toEqual(adminUser._id);
      expect(user.email).toBe(adminUser.email);
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(UserService.getUserById(fakeId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('createUser', () => {
    it('should create new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'user',
      };

      const user = await UserService.createUser(userData);

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: adminUser.email,
        password: 'password123',
        name: 'Duplicate User',
      };

      await expect(UserService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const updateData = {
        name: 'Updated Name',
        role: 'admin',
      };

      const user = await UserService.updateUser(regularUser._id, updateData);

      expect(user.name).toBe(updateData.name);
      expect(user.role).toBe(updateData.role);
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(
        UserService.updateUser(fakeId, { name: 'Updated' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      await UserService.deleteUser(regularUser._id);

      await expect(UserService.getUserById(regularUser._id)).rejects.toThrow(
        'User not found'
      );
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(UserService.deleteUser(fakeId)).rejects.toThrow(
        'User not found'
      );
    });
  });
});
