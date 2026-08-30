import { z } from 'zod';
import { TicketStatuses, TicketPriorities } from '../models/Ticket';

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    assetId: z.string().optional().nullable(),
    priority: z.enum(TicketPriorities).optional(),
    category: z.string().optional(),
    source: z.enum(['Web', 'Email', 'Mobile', 'QR Scan', 'Simulator']).optional(),
  }),
});

export const updateTicketSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(TicketPriorities).optional(),
    status: z.enum(TicketStatuses).optional(),
    assignedEngineerId: z.string().optional().nullable(),
    assignedTeam: z.string().optional(),
    resolution: z.string().optional(),
  }),
});

export const commentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty'),
    attachments: z.array(z.string()).optional(),
  }),
});

export const worklogSchema = z.object({
  body: z.object({
    timeSpent: z.number().min(1, 'Time spent must be at least 1 minute'),
    description: z.string().min(3, 'Work description must be at least 3 characters'),
  }),
});
