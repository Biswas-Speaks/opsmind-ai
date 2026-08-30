import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Ticket } from '../models/Ticket';
import { SLA } from '../models/SLA';
import { TicketComment } from '../models/TicketComment';
import { TicketWorklog } from '../models/TicketWorklog';
import { AuditLog } from '../models/AuditLog';
import { Asset } from '../models/Asset';
import { AIService } from '../services/ai.service';
import { RAGService } from '../services/rag.service';
import { AppError } from '../utils/errors';
import { emitSocketEvent } from '../sockets';

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const getTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Apply role-based filters (e.g. Employee can only view their own tickets)
    if (req.user?.role && (req.user.role as any).name === 'Employee') {
      filter.requester = req.user._id;
    } else {
      // IT Staff filters
      if (req.query.requesterId && isValidObjectId(req.query.requesterId as string)) {
        filter.requester = req.query.requesterId;
      }
      if (req.query.engineerId && isValidObjectId(req.query.engineerId as string)) {
        filter.assignedEngineer = req.query.engineerId;
      }
    }

    // Apply general filters
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    // Apply search
    if (req.query.search) {
      const searchStr = req.query.search as string;
      filter.$or = [
        { ticketNumber: { $regex: searchStr, $options: 'i' } },
        { title: { $regex: searchStr, $options: 'i' } },
        { description: { $regex: searchStr, $options: 'i' } },
      ];
    }

    const total = await Ticket.countDocuments(filter);
    const tickets = await Ticket.find(filter)
      .populate('requester assignedEngineer asset location department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        tickets,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let ticket;

    if (isValidObjectId(id)) {
      ticket = await Ticket.findById(id).populate('requester assignedEngineer asset location department sla');
    } else {
      ticket = await Ticket.findOne({ ticketNumber: id.toUpperCase() }).populate('requester assignedEngineer asset location department sla');
    }

    if (!ticket) {
      return next(new AppError('Ticket not found.', 404, 'TICKET_NOT_FOUND'));
    }

    // Load comments and worklogs for detail page
    const comments = await TicketComment.find({ ticket: ticket._id }).populate('author', 'username email').sort({ createdAt: 1 });
    const worklogs = await TicketWorklog.find({ ticket: ticket._id }).populate('engineer', 'username email').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ticket,
        comments,
        worklogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, assetId, source } = req.body;
    const requester = req.user;

    if (!requester) {
      return next(new AppError('Unauthorized.', 401, 'UNAUTHORIZED'));
    }

    // Generate unique sequential ticket number
    const count = await Ticket.countDocuments({});
    const ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;

    // Perform AI analysis automatically (priority, category, team)
    const aiAnalysis = await AIService.analyzeTicket(title, description);

    // Find corresponding SLA template based on priority
    const priority = req.body.priority || aiAnalysis.priority;
    const sla = await SLA.findOne({ priority });

    // Calculate due date based on SLA resolution time
    let dueDate = new Date();
    if (sla) {
      dueDate = new Date(dueDate.getTime() + sla.resolutionTime * 60000);
    } else {
      dueDate = new Date(dueDate.getTime() + 48 * 60 * 60000); // 2 days default
    }

    // Resolve Asset reference
    let assetDoc = null;
    if (assetId && isValidObjectId(assetId)) {
      assetDoc = await Asset.findById(assetId);
    }

    const ticket = await Ticket.create({
      ticketNumber,
      title,
      description,
      requester: requester._id,
      department: requester.department || undefined,
      location: requester.location || undefined,
      asset: assetDoc ? assetDoc._id : undefined,
      category: aiAnalysis.category,
      subcategory: aiAnalysis.subcategory,
      priority,
      status: 'Open',
      assignedTeam: aiAnalysis.suggestedTeam,
      sla: sla ? sla._id : undefined,
      dueDate,
      source: source || 'Web',
      aiAnalysis,
    });

    // Write Audit Log
    await AuditLog.create({
      user: requester._id,
      action: 'Ticket Created',
      entity: 'Ticket',
      entityId: ticket.ticketNumber,
      newValue: `Raised ticket ${ticket.ticketNumber} regarding ${ticket.category}`,
    });

    // Broadcast ticket creation via socket
    emitSocketEvent('ticket.created', {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      priority: ticket.priority,
      team: ticket.assignedTeam,
    });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return next(new AppError('Ticket not found.', 404, 'TICKET_NOT_FOUND'));
    }

    const oldStatus = ticket.status;
    const oldPriority = ticket.priority;

    // Handle reference modifications
    if (updates.assignedEngineerId !== undefined) {
      if (updates.assignedEngineerId && isValidObjectId(updates.assignedEngineerId)) {
        ticket.assignedEngineer = updates.assignedEngineerId;
        // Auto assign moves status to Assigned
        if (ticket.status === 'Open') {
          ticket.status = 'Assigned';
        }
      } else {
        ticket.assignedEngineer = undefined;
      }
    }

    Object.assign(ticket, updates);
    await ticket.save();

    // Log changes to AuditLog if status or priority shifted
    if (ticket.status !== oldStatus || ticket.priority !== oldPriority) {
      await AuditLog.create({
        user: req.user?._id,
        action: 'Ticket Updated',
        entity: 'Ticket',
        entityId: ticket.ticketNumber,
        oldValue: `Status: ${oldStatus}, Priority: ${oldPriority}`,
        newValue: `Status: ${ticket.status}, Priority: ${ticket.priority}`,
      });

      // Broadcast update
      emitSocketEvent('ticket.updated', {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        priority: ticket.priority,
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const resolveTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      return next(new AppError('Resolution notes are required to resolve a ticket.', 400, 'BAD_REQUEST'));
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return next(new AppError('Ticket not found.', 404, 'TICKET_NOT_FOUND'));
    }

    // Perform AI validation to check if resolution notes resolve description
    const validation = await AIService.validateResolution(ticket.description, resolution);
    if (!validation.resolved && validation.confidence < 30) {
      return next(
        new AppError(
          `AI Validation failed: ${validation.notes} (Confidence: ${validation.confidence}%)`,
          400,
          'RESOLUTION_VALIDATION_FAILED'
        )
      );
    }

    ticket.status = 'Resolved';
    ticket.resolution = resolution;
    ticket.resolvedAt = new Date();
    await ticket.save();

    // Log Audit Log
    await AuditLog.create({
      user: req.user?._id,
      action: 'Ticket Resolved',
      entity: 'Ticket',
      entityId: ticket.ticketNumber,
      newValue: `Resolved with AI validation confidence: ${validation.confidence}%`,
    });

    // Broadcast Socket
    emitSocketEvent('ticket.updated', {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
    });

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, attachments } = req.body;
    const author = req.user;

    if (!author) {
      return next(new AppError('Not authenticated.', 401, 'UNAUTHORIZED'));
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return next(new AppError('Ticket not found.', 404, 'TICKET_NOT_FOUND'));
    }

    const comment = await TicketComment.create({
      ticket: ticket._id,
      author: author._id,
      content,
      attachments: attachments || [],
    });

    // Auto set status to In Progress if engineer replies
    if ((author.role as any).name === 'IT Engineer' && ticket.status === 'Assigned') {
      ticket.status = 'In Progress';
      await ticket.save();
    }

    const populated = await TicketComment.findById(comment._id).populate('author', 'username email');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const addWorklog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { timeSpent, description } = req.body;
    const engineer = req.user;

    if (!engineer) {
      return next(new AppError('Not authenticated.', 401, 'UNAUTHORIZED'));
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return next(new AppError('Ticket not found.', 404, 'TICKET_NOT_FOUND'));
    }

    const worklog = await TicketWorklog.create({
      ticket: ticket._id,
      engineer: engineer._id,
      timeSpent,
      description,
    });

    const populated = await TicketWorklog.findById(worklog._id).populate('engineer', 'username email');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const getTroubleshootingSteps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id).populate('asset');
    if (!ticket) {
      return next(new AppError('Ticket not found.', 404, 'TICKET_NOT_FOUND'));
    }

    let assetContext = '';
    if (ticket.asset) {
      const ast = ticket.asset as any;
      assetContext = `Category: ${ast.category}, Manufacturer: ${ast.manufacturer}, Model: ${ast.model}, Condition: ${ast.condition}, IP Address: ${ast.ipAddress || 'N/A'}`;
    }

    // Call AI service to generate step by step diagnosis based on ticket details
    const troubleshootingMarkdown = await AIService.generateTroubleshooting(
      ticket.title,
      ticket.description,
      assetContext
    );

    // Optional RAG search: Look up knowledge base for matches
    const citations = await RAGService.searchKnowledge(ticket.title + ' ' + ticket.description, 2);

    res.status(200).json({
      success: true,
      data: {
        steps: troubleshootingMarkdown,
        citations: citations.map(c => ({
          title: c.document?.title || 'System SOP Manual',
          category: c.document?.category || 'Troubleshooting',
          content: c.content,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
