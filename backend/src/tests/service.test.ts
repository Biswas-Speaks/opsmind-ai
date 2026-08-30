import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { SLA } from '../models/SLA';
import { Ticket } from '../models/Ticket';
import { Asset } from '../models/Asset';

describe('Service Desk & Incidents API', () => {
  let token: string;
  let testAssetId: string;
  let testTicketId: string;

  beforeAll(async () => {
    // Connect database if not done
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://127.0.0.1:27017/opsmind-ai-test');
    }

    // Clear and seed clean testing accounts
    await Role.deleteMany({});
    await User.deleteMany({});
    await Ticket.deleteMany({});
    await Asset.deleteMany({});
    await SLA.deleteMany({});

    // Seed default SLAs
    await SLA.create({ priority: 'Medium', responseTime: 120, resolutionTime: 480 });

    // Seed engineer role
    const testRole = await Role.create({
      name: 'IT Engineer',
      description: 'Testing engineer role',
      permissions: ['tickets:read', 'tickets:update', 'tickets:worklog', 'ai:troubleshoot'],
    });

    // Seed test engineer user
    const engineer = await User.create({
      username: 'testeng',
      email: 'engineer@opsmind.local',
      passwordHash: 'engineer123',
      role: testRole._id,
    });

    // Seed test asset
    const asset = await Asset.create({
      assetTag: 'OPS-ASSET-999999',
      serialNumber: 'SN-TEST-INCIDENT',
      category: 'Laptop',
      manufacturer: 'Lenovo',
      model: 'ThinkPad T14',
      condition: 'Good',
      status: 'Available',
    });
    testAssetId = asset._id.toString();

    // Login to get token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'engineer@opsmind.local',
        password: 'engineer123',
      });
    token = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/v1/tickets (Create Ticket)', () => {
    it('should successfully raise an incident with automated AI priority/category scoping', async () => {
      const res = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'WiFi connectivity drops at reception AP',
          description: 'Employees in the lobby cannot connect to the WiFi. The ping to the AP gateway is failing.',
          assetId: testAssetId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticketNumber).toContain('TKT-');
      expect(res.body.data.category).toBe('Network');
      expect(res.body.data.priority).toBe('Medium');
      expect(res.body.data.status).toBe('Open');

      testTicketId = res.body.data._id;
    });

    it('should block ticket creation if missing title or description', async () => {
      const res = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Too short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tickets (List and Detail)', () => {
    it('should return a paginated list of tickets', async () => {
      const res = await request(app)
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tickets.length).toBeGreaterThan(0);
    });

    it('should retrieve a single ticket by internal ID', async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${testTicketId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticket._id).toBe(testTicketId);
    });
  });

  describe('POST /api/v1/tickets/:id/comments & /worklogs', () => {
    it('should add a response comment to the ticket thread', async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${testTicketId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'We have dispatched a field technician to power-cycle the AP switch.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('We have dispatched a field technician to power-cycle the AP switch.');
    });

    it('should log engineering labor time spent working on resolution', async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${testTicketId}/worklogs`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          timeSpent: 45,
          description: 'Inspected switch port configuration and re-crimped RJ45 connector.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.timeSpent).toBe(45);
    });
  });

  describe('GET /api/v1/tickets/:id/troubleshoot (AI diagnostics)', () => {
    it('should return step-by-step diagnostic actions', async () => {
      const res = await request(app)
        .get(`/api/v1/tickets/${testTicketId}/troubleshoot`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.steps).toBeDefined();
      expect(res.body.data.citations).toBeDefined();
    });
  });

  describe('POST /api/v1/tickets/:id/resolve (Incident Resolution)', () => {
    it('should accept valid resolution notes and mark status Resolved', async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${testTicketId}/resolve`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          resolution: 'Rebooted the access point PoE interface. Ping latencies have returned to normal and signal holds.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Resolved');
      expect(res.body.data.resolution).toContain('Rebooted the access point');
    });

    it('should reject resolution notes that are empty', async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${testTicketId}/resolve`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          resolution: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
