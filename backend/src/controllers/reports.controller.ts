import { Request, Response, NextFunction } from 'express';
import { Ticket } from '../models/Ticket';
import { Asset } from '../models/Asset';

export const getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Group tickets by Category
    const categoryStats = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } },
    ]);

    // 2. Group tickets by Priority
    const priorityStats = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } },
    ]);

    // 3. Group tickets by Status
    const statusStats = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } },
    ]);

    // 4. SLA performance metrics
    const totalTickets = await Ticket.countDocuments({});
    const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
    const closedTickets = await Ticket.countDocuments({ status: 'Closed' });

    // Calculate SLA compliance (resolved on or before due date)
    const slaCompliant = await Ticket.countDocuments({
      status: { $in: ['Resolved', 'Closed'] },
      $expr: { $lte: ['$resolvedAt', '$dueDate'] },
    });

    const slaBreached = await Ticket.countDocuments({
      status: { $in: ['Resolved', 'Closed'] },
      $expr: { $gt: ['$resolvedAt', '$dueDate'] },
    });

    // 5. Assets by category
    const assetStats = await Asset.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        tickets: {
          total: totalTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
          byCategory: categoryStats,
          byPriority: priorityStats,
          byStatus: statusStats,
        },
        assets: {
          byCategory: assetStats,
        },
        sla: {
          compliant: slaCompliant,
          breached: slaBreached,
          rate: resolvedTickets + closedTickets > 0 ? Math.round((slaCompliant / (resolvedTickets + closedTickets)) * 100) : 100,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
