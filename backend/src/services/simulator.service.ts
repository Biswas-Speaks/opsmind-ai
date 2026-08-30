import { InfrastructureDevice } from '../models/InfrastructureDevice';
import { Ticket } from '../models/Ticket';
import { User } from '../models/User';
import { SLA } from '../models/SLA';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { AIService } from './ai.service';
import { emitSocketEvent } from '../sockets';

let simulatorInterval: NodeJS.Timeout | null = null;

export const startInfrastructureSimulator = () => {
  if (simulatorInterval) return;

  if (process.env.NODE_ENV !== 'test') {
    console.log('[Simulator Service] Uptime Health Simulator Started.');
  }

  // Runs every 60 seconds
  simulatorInterval = setInterval(async () => {
    try {
      const devices = await InfrastructureDevice.find({});
      if (devices.length === 0) return;

      // Select random device to toggle status
      const randomIndex = Math.floor(Math.random() * devices.length);
      const device = devices[randomIndex];

      const oldStatus = device.status;
      const newStatus = oldStatus === 'Online' ? (Math.random() > 0.5 ? 'Offline' : 'Degraded') : 'Online';

      device.status = newStatus;
      device.lastSeen = new Date();
      await device.save();

      // Emit Socket Update
      emitSocketEvent('camera.status', {
        id: device._id,
        name: device.name,
        category: device.category,
        oldStatus,
        newStatus,
        ipAddress: device.ipAddress,
      });

      // Find IT Managers and Super Admins to send Notifications
      const staffUsers = await User.find({}).populate('role');
      const managers = staffUsers.filter(
        (u: any) => u.role?.name === 'Super Admin' || u.role?.name === 'IT Manager'
      );

      if (newStatus === 'Offline') {
        const title = `Alert: Infrastructure ${device.category} Offline`;
        const message = `Device '${device.name}' (IP: ${device.ipAddress}) went offline. Immediate inspection required.`;

        // Create Notifications
        const notifPromises = managers.map((mgr) =>
          Notification.create({
            recipient: mgr._id,
            title,
            message,
            type: 'Camera',
            read: false,
          })
        );
        await Promise.all(notifPromises);

        // Broadcast notifications updates via Socket
        emitSocketEvent('notification.created', { title, message });

        // Auto-Trigger Ticket Creation (Agentic Simulation)
        const systemUser = await User.findOne({ username: 'admin' });
        const sla = await SLA.findOne({ priority: 'High' });

        if (systemUser) {
          // Generate unique ticket number
          const nextNum = (await Ticket.countDocuments({})) + 1;
          const ticketNumber = `TKT-${String(nextNum).padStart(6, '0')}`;

          const ticketTitle = `Automated Incident: ${device.name} Offline`;
          const ticketDesc = `Infrastructure monitoring system detected that ${device.category} '${device.name}' at IP ${device.ipAddress} is unreachable. Latency ping failed.`;

          // Run AI Ticket analysis
          const aiAnalysis = await AIService.analyzeTicket(ticketTitle, ticketDesc);

          const ticket = await Ticket.create({
            ticketNumber,
            title: ticketTitle,
            description: ticketDesc,
            requester: systemUser._id,
            category: aiAnalysis.category,
            subcategory: aiAnalysis.subcategory,
            priority: aiAnalysis.priority,
            status: 'Open',
            assignedTeam: aiAnalysis.suggestedTeam,
            sla: sla?._id,
            source: 'Simulator',
            aiAnalysis,
          });

          // Log Audit Trail
          await AuditLog.create({
            user: systemUser._id,
            action: 'Ticket Created',
            entity: 'Ticket',
            entityId: ticket.ticketNumber,
            newValue: 'Automated simulator ticket raised.',
          });

          // Broadcast Ticket Creation via Socket
          emitSocketEvent('ticket.created', {
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            priority: ticket.priority,
            team: ticket.assignedTeam,
          });
        }
      }
    } catch (error) {
      console.error(`[Simulator Error] Toggle run failed: ${(error as Error).message}`);
    }
  }, 60000);
};

export const stopInfrastructureSimulator = () => {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Simulator Service] Uptime Health Simulator Stopped.');
    }
  }
};
