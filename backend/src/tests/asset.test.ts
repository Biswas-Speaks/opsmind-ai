import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { Asset } from '../models/Asset';
import { AssetHistory } from '../models/AssetHistory';
import { AssetAssignment } from '../models/AssetAssignment';
import jwt from 'jsonwebtoken';

const TEST_DB_URL = 'mongodb://127.0.0.1:27017/opsmind-ai-test';

describe('Asset Management API', () => {
  let managerToken = '';
  let employeeId = '';
  let assetId = '';
  let assetTag = '';

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.JWT_SECRET = 'test_jwt_access_secret_12345';
    process.env.NODE_ENV = 'test';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URL);
    }

    // Clear DB collections
    await Asset.deleteMany({});
    await AssetHistory.deleteMany({});
    await AssetAssignment.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});

    // Seed roles
    const managerRole = await Role.create({
      name: 'IT Manager',
      description: 'Manager',
      permissions: ['assets:read', 'assets:create', 'assets:update', 'tickets:read'],
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Employee',
      permissions: ['assets:read_own'],
    });

    // Seed IT Manager user
    const manager = await User.create({
      username: 'testmanager',
      email: 'testmanager@opsmind.local',
      passwordHash: 'manager123', // Will be hashed
      role: managerRole._id,
    });

    // Seed Employee user
    const employee = await User.create({
      username: 'testemployee',
      email: 'testemployee@opsmind.local',
      passwordHash: 'employee123',
      role: employeeRole._id,
    });

    employeeId = employee.id;

    // Login manager to get token
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testmanager@opsmind.local', password: 'manager123' });

    managerToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await Asset.deleteMany({});
    await AssetHistory.deleteMany({});
    await AssetAssignment.deleteMany({});
    await User.deleteMany({});
    await Role.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/v1/assets (Create Asset)', () => {
    it('should successfully create a new asset with auto-tagging', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          serialNumber: 'SN-LAPTOP-991',
          category: 'Laptop',
          manufacturer: 'Dell',
          model: 'Latitude 5420',
          condition: 'New',
          notes: 'Standard deployment laptop',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assetTag).toBe('OPS-ASSET-000001');
      expect(res.body.data.status).toBe('Available');

      assetId = res.body.data._id;
      assetTag = res.body.data.assetTag;
    });

    it('should block asset creation if missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          serialNumber: 'SN-LAPTOP-992',
          category: 'Laptop',
          // Missing manufacturer and model
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should log registration to AssetHistory', async () => {
      const history = await AssetHistory.find({ asset: assetId });
      expect(history.length).toBe(1);
      expect(history[0].action).toBe('Asset Registered');
    });
  });

  describe('GET /api/v1/assets (List & Retrieve)', () => {
    it('should return paginated assets inventory', async () => {
      const res = await request(app)
        .get('/api/v1/assets');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assets.length).toBe(1);
    });

    it('should find asset by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/assets/${assetId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assetTag).toBe(assetTag);
    });

    it('should find asset by Asset Tag (QR scan path)', async () => {
      const res = await request(app)
        .get(`/api/v1/assets/${assetTag}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(assetId);
    });
  });

  describe('POST /api/v1/assets/:id/assign (Checkout Lifecycle)', () => {
    it('should checkout/assign asset to an employee', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${assetId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          assigneeId: employeeId,
          notes: 'Developer assignment',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.asset.status).toBe('Assigned');

      // Assert Active assignment is created
      const activeAssignment = await AssetAssignment.findOne({ asset: assetId, status: 'Active' });
      expect(activeAssignment).toBeDefined();
      expect(activeAssignment?.assignee.toString()).toBe(employeeId);
    });

    it('should prevent checkout if asset is already assigned', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${assetId}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          assigneeId: employeeId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should write an assignment record in AssetHistory', async () => {
      const history = await AssetHistory.find({ asset: assetId }).sort({ timestamp: -1 });
      expect(history[0].action).toBe('Asset Assigned');
      expect(history[0].newValue).toContain('Assigned to testemployee');
    });
  });

  describe('POST /api/v1/assets/:id/return (Check-in Lifecycle)', () => {
    it('should return the asset, making it available again', async () => {
      const res = await request(app)
        .post(`/api/v1/assets/${assetId}/return`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          conditionOnReturn: 'Good',
          notes: 'Returned after lease end',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.asset.status).toBe('Available');

      // Assert Active assignment is closed
      const activeAssignment = await AssetAssignment.findOne({ asset: assetId, status: 'Active' });
      expect(activeAssignment).toBeNull();
    });

    it('should write return log to AssetHistory', async () => {
      const history = await AssetHistory.find({ asset: assetId }).sort({ timestamp: -1 });
      expect(history[0].action).toBe('Asset Returned');
      expect(history[0].newValue).toContain('Returned by testemployee');
    });
  });
});
