import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { Role } from '../models/Role';
import { User } from '../models/User';

const TEST_DB_URL = 'mongodb://127.0.0.1:27017/opsmind-ai-test';

beforeAll(async () => {
  // Override environment variables for testing
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.JWT_SECRET = 'test_jwt_access_secret_12345';
  process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_67890';
  process.env.NODE_ENV = 'test';

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URL);
  }

  // Clear data
  await User.deleteMany({});
  await Role.deleteMany({});

  // Seed roles required for signup
  await Role.insertMany([
    { name: 'Super Admin', description: 'Admin', permissions: ['all'] },
    { name: 'Employee', description: 'Employee', permissions: ['tickets:create'] },
  ]);
});

afterAll(async () => {
  await User.deleteMany({});
  await Role.deleteMany({});
  await mongoose.connection.close();
});

describe('Authentication API', () => {
  let accessToken = '';
  let refreshToken = '';

  const testUser = {
    username: 'testemployee',
    email: 'testemployee@opsmind.local',
    password: 'password123',
    roleName: 'Employee',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe(testUser.username);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should fail to register a user with a duplicate email/username', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REGISTRATION_FAILED');
    });

    it('should fail registration with invalid input schema', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'sh',
          email: 'invalid-email',
          password: '123',
          roleName: 'InvalidRole',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should fail login with incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should deny access if authorization header is missing', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should get current user profile with valid JWT', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens using valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Update token for subsequent calls
      accessToken = res.body.data.accessToken;
    });

    it('should fail refresh with rotated/old refresh token', async () => {
      // Trying the old rotated refresh token
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and invalidate session', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
