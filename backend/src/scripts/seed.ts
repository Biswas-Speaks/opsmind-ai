import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

// Override local DNS to connect to Atlas cluster reliably
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Load config
dotenv.config();

import { Role } from '../models/Role';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Location } from '../models/Location';
import { Vendor } from '../models/Vendor';
import { Asset } from '../models/Asset';
import { SLA } from '../models/SLA';
import { Ticket } from '../models/Ticket';
import { KnowledgeDocument, KnowledgeChunk } from '../models/Knowledge';
import { InfrastructureDevice } from '../models/InfrastructureDevice';
import { RAGService } from '../services/rag.service';
import { connectDB } from '../config/db';

const rolesData = [
  {
    name: 'Super Admin',
    description: 'Full system access, admin panel configurations, and audit review.',
    permissions: ['all'],
  },
  {
    name: 'IT Manager',
    description: 'Manages assets, assigns tickets, monitors SLAs, reviews maintenance & reports.',
    permissions: [
      'assets:read',
      'assets:create',
      'assets:update',
      'tickets:read',
      'tickets:update',
      'tickets:assign',
      'tickets:escalate',
      'sla:manage',
      'maintenance:manage',
      'knowledge:manage',
      'reports:read',
    ],
  },
  {
    name: 'IT Engineer',
    description: 'Troubleshoots and resolves assigned incidents, updates maintenance status, adds worklogs.',
    permissions: [
      'tickets:read',
      'tickets:update',
      'tickets:worklog',
      'maintenance:update',
      'knowledge:read',
      'ai:troubleshoot',
    ],
  },
  {
    name: 'Employee',
    description: 'Standard organizational employee. Can view own assets, open tickets, comment and confirm resolution.',
    permissions: [
      'assets:read_own',
      'tickets:create',
      'tickets:read_own',
      'tickets:comment',
      'tickets:close',
    ],
  },
  {
    name: 'Auditor',
    description: 'Read-only access to audit logs, compliance assets, tickets, and operational analytics reports.',
    permissions: [
      'assets:read',
      'tickets:read',
      'users:read',
      'logs:read',
      'reports:read',
    ],
  },
];

const slaData = [
  { priority: 'Low', responseTime: 240, resolutionTime: 1440 }, // Response: 4h, Resolution: 24h
  { priority: 'Medium', responseTime: 120, resolutionTime: 480 }, // Response: 2h, Resolution: 8h
  { priority: 'High', responseTime: 30, resolutionTime: 240 }, // Response: 30m, Resolution: 4h
  { priority: 'Critical', responseTime: 15, resolutionTime: 120 }, // Response: 15m, Resolution: 2h
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Seeding roles...');
    await Role.deleteMany({});
    const roles = await Role.insertMany(rolesData);
    console.log('Roles seeded.');

    console.log('Seeding SLA templates...');
    await SLA.deleteMany({});
    await SLA.insertMany(slaData);
    console.log('SLAs seeded.');

    console.log('Seeding departments & locations...');
    await Department.deleteMany({});
    await Location.deleteMany({});

    const itDept = await Department.create({
      name: 'Information Technology',
      code: 'IT',
      description: 'IT Systems and Infrastructure Support Group',
    });

    const hrDept = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      description: 'Human Resources Operations',
    });

    const hqLoc = await Location.create({
      name: 'Headquarters',
      code: 'HQ-01',
      address: '123 Enterprise Blvd, Tech City',
      type: 'Office',
    });

    const whLoc = await Location.create({
      name: 'Warehouse',
      code: 'WH-02',
      address: '456 Industrial Parkway, logistics Zone',
      type: 'Warehouse',
    });

    console.log('Seeding vendors...');
    await Vendor.deleteMany({});
    const ciscoVendor = await Vendor.create({
      name: 'Cisco Systems',
      contactPerson: 'Sarah Jenkins',
      email: 'sjenkins@cisco.com',
      phone: '+1 555-901-2038',
      address: '170 West Tasman Dr, San Jose, CA',
      rating: 5,
      services: ['Router Hardware', 'Switch Maintenance', 'SLA support'],
    });

    const dellVendor = await Vendor.create({
      name: 'Dell Technologies',
      contactPerson: 'John Cooper',
      email: 'jcooper@dell.com',
      phone: '+1 555-882-9901',
      address: 'One Dell Way, Round Rock, TX',
      rating: 4,
      services: ['Laptop Procurement', 'Server Support'],
    });

    console.log('Seeding default demo accounts...');
    await User.deleteMany({});

    const adminRole = roles.find(r => r.name === 'Super Admin');
    const managerRole = roles.find(r => r.name === 'IT Manager');
    const engineerRole = roles.find(r => r.name === 'IT Engineer');
    const employeeRole = roles.find(r => r.name === 'Employee');
    const auditorRole = roles.find(r => r.name === 'Auditor');

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@opsmind.local',
      passwordHash: 'admin123',
      role: adminRole?._id,
      department: itDept._id,
      location: hqLoc._id,
    });

    const managerUser = await User.create({
      username: 'manager',
      email: 'manager@opsmind.local',
      passwordHash: 'manager123',
      role: managerRole?._id,
      department: itDept._id,
      location: hqLoc._id,
    });

    const engineerUser = await User.create({
      username: 'engineer',
      email: 'engineer@opsmind.local',
      passwordHash: 'engineer123',
      role: engineerRole?._id,
      department: itDept._id,
      location: hqLoc._id,
    });

    const employeeUser = await User.create({
      username: 'employee',
      email: 'employee@opsmind.local',
      passwordHash: 'employee123',
      role: employeeRole?._id,
      department: hrDept._id,
      location: hqLoc._id,
    });

    await User.create({
      username: 'auditor',
      email: 'auditor@opsmind.local',
      passwordHash: 'auditor123',
      role: auditorRole?._id,
      department: hrDept._id,
      location: hqLoc._id,
    });

    console.log('Seeding assets...');
    await Asset.deleteMany({});

    const laptop1 = await Asset.create({
      assetTag: 'OPS-ASSET-000001',
      serialNumber: 'SN-X1CARBON-88',
      category: 'Laptop',
      manufacturer: 'Lenovo',
      model: 'ThinkPad X1 Carbon Gen 10',
      description: 'Intel i7, 16GB RAM, 512GB SSD',
      condition: 'New',
      status: 'Assigned',
      location: hqLoc._id,
      department: hrDept._id,
      assignedUser: employeeUser._id,
      vendor: dellVendor._id,
    });

    const laptop2 = await Asset.create({
      assetTag: 'OPS-ASSET-000002',
      serialNumber: 'SN-DELLXPS-40',
      category: 'Laptop',
      manufacturer: 'Dell',
      model: 'XPS 15 9520',
      description: 'Intel i9, 32GB RAM, 1TB SSD',
      condition: 'Good',
      status: 'Available',
      location: hqLoc._id,
      department: itDept._id,
      vendor: dellVendor._id,
    });

    const coreSwitch = await Asset.create({
      assetTag: 'OPS-ASSET-000003',
      serialNumber: 'SN-CISCO-CORE-99',
      category: 'Network Switch',
      manufacturer: 'Cisco',
      model: 'Catalyst 9300 48-Port',
      description: 'Core stack Layer-3 distribution switch',
      condition: 'Good',
      status: 'In Use',
      location: hqLoc._id,
      department: itDept._id,
      vendor: ciscoVendor._id,
      ipAddress: '192.168.1.10',
      hostname: 'HQ-CORESWITCH-01',
    });

    console.log('Seeding monitored Infrastructure CCTV devices...');
    await InfrastructureDevice.deleteMany({});

    await InfrastructureDevice.create({
      name: 'Main Entrance Lobby Camera',
      category: 'CCTV Camera',
      ipAddress: '192.168.1.20',
      macAddress: '00:1B:44:11:3A:FF',
      status: 'Online',
      location: hqLoc._id,
    });

    await InfrastructureDevice.create({
      name: 'Server Room Security Cam',
      category: 'CCTV Camera',
      ipAddress: '192.168.1.21',
      macAddress: '00:1B:44:11:3B:55',
      status: 'Online',
      location: hqLoc._id,
    });

    await InfrastructureDevice.create({
      name: 'Warehouse Loading Bay CCTV',
      category: 'CCTV Camera',
      ipAddress: '192.168.2.30',
      macAddress: '00:2A:88:FF:99:A1',
      status: 'Online',
      location: whLoc._id,
    });

    await InfrastructureDevice.create({
      name: 'Core HQ NVR Channel A',
      category: 'NVR',
      ipAddress: '192.168.1.15',
      macAddress: '00:1B:2C:99:10:0A',
      status: 'Online',
      location: hqLoc._id,
    });

    console.log('Seeding ticket incidents...');
    await Ticket.deleteMany({});
    
    // Seed unresolved ticket
    const ticket1 = await Ticket.create({
      ticketNumber: 'TKT-000001',
      title: 'Lobby AP wifi disconnects frequently',
      description: 'Employees are losing WiFi connection repeatedly when working in the reception area. The signal keeps dropping every 10 minutes.',
      requester: employeeUser._id,
      category: 'Network',
      subcategory: 'WiFi',
      priority: 'Medium',
      status: 'In Progress',
      assignedTeam: 'Network Team',
      assignedEngineer: engineerUser._id,
      dueDate: new Date(Date.now() + 8 * 3600000),
      source: 'Web',
    });

    // Seed resolved ticket
    const ticket2 = await Ticket.create({
      ticketNumber: 'TKT-000002',
      title: 'Server Room Backup UPS Battery Failure',
      description: 'The UPS console shows a battery replacement warning and backup duration is under 5 minutes.',
      requester: managerUser._id,
      category: 'Hardware',
      subcategory: 'Power',
      priority: 'High',
      status: 'Resolved',
      assignedTeam: 'Infrastructure Team',
      assignedEngineer: engineerUser._id,
      dueDate: new Date(Date.now() - 2 * 3600000),
      resolution: 'Replaced defective lead-acid battery cells. Tested load bypass and backup runtime is restored to 35 minutes.',
      resolvedAt: new Date(Date.now() - 1 * 3600000),
      source: 'Web',
    });

    console.log('Seeding RAG Knowledge Base Manuals...');
    await KnowledgeDocument.deleteMany({});
    await KnowledgeChunk.deleteMany({});

    const docWiFi = await KnowledgeDocument.create({
      title: 'Office WiFi SOP & Connectivity Troubleshooting',
      category: 'Network',
      tags: ['wifi', 'ap', 'cisco', 'dhcp'],
      createdBy: adminUser._id,
    });

    const wifiContent = `
      WiFi incident troubleshooting steps:
      1. Check if the Access Point is powered. Verify PoE switch port status and power outputs.
      2. Ping the AP IP address to verify Layer 2 connectivity.
      3. Verify if DHCP pool is exhausted. Check IP address allocations under scope.
      4. Examine if there is RF signal interference. Check Channel overlaps (2.4GHz vs 5GHz configuration).
      5. Restart the target Access Point interface from the Cisco wireless network controller console.
    await RAGService.ingestDocument(docWiFi.id, docWiFi.title, wifiContent);

    const docCCTV = await KnowledgeDocument.create({
      title: 'CCTV Camera Power & Stream Loss SOP',
      category: 'CCTV',
      tags: ['cctv', 'camera', 'poe', 'nvr'],
      createdBy: adminUser._id,
    });

    const cctvContent = `
      CCTV camera outage SOP actions:
      1. Confirm camera model specifications and verify standard power requirements (e.g. 15W PoE vs 30W PoE+).
      2. Audit the PoE switch. Disable and enable the port to power-cycle the camera.
      3. Check NVR network connectivity. Verify camera ping status from the NVR diagnostics console.
      4. If ping succeeds but stream fails, log in to the camera web panel and verify RTSP credentials.
      5. If cable length exceeds 100 meters, signal attenuation might degrade feeds. Install a PoE repeater.
    `;
    await RAGService.ingestDocument(docCCTV.id, docCCTV.title, cctvContent);

    console.log('Database Seeding Completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${(error as Error).message}`);
    process.exit(1);
  }
};

seedDatabase();
