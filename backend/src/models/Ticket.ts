import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';
import { IDepartment } from './Department';
import { ILocation } from './Location';
import { IAsset } from './Asset';
import { ISLA } from './SLA';

export const TicketStatuses = [
  'Open',
  'Assigned',
  'In Progress',
  'Waiting for User',
  'Waiting for Vendor',
  'Escalated',
  'Resolved',
  'Closed',
  'Cancelled',
] as const;

export const TicketPriorities = ['Low', 'Medium', 'High', 'Critical'] as const;

export interface ITicket extends Document {
  ticketNumber: string;
  title: string;
  description: string;
  requester: Schema.Types.ObjectId | IUser;
  department?: Schema.Types.ObjectId | IDepartment;
  location?: Schema.Types.ObjectId | ILocation;
  asset?: Schema.Types.ObjectId | IAsset;
  category: string;
  subcategory?: string;
  priority: typeof TicketPriorities[number];
  status: typeof TicketStatuses[number];
  assignedTeam?: string;
  assignedEngineer?: Schema.Types.ObjectId | IUser;
  sla?: Schema.Types.ObjectId | ISLA;
  dueDate?: Date;
  source: 'Web' | 'Email' | 'Mobile' | 'QR Scan' | 'Simulator';
  aiAnalysis?: {
    category: string;
    subcategory?: string;
    priority: string;
    possibleCauses: string[];
    recommendedActions: string[];
    suggestedTeam: string;
  };
  resolution?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    asset: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
    },
    category: {
      type: String,
      required: true,
      default: 'Other',
    },
    subcategory: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: TicketPriorities,
      default: 'Medium',
    },
    status: {
      type: String,
      enum: TicketStatuses,
      default: 'Open',
    },
    assignedTeam: {
      type: String,
      trim: true,
    },
    assignedEngineer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sla: {
      type: Schema.Types.ObjectId,
      ref: 'SLA',
    },
    dueDate: {
      type: Date,
    },
    source: {
      type: String,
      enum: ['Web', 'Email', 'Mobile', 'QR Scan', 'Simulator'],
      default: 'Web',
    },
    aiAnalysis: {
      category: { type: String },
      subcategory: { type: String },
      priority: { type: String },
      possibleCauses: { type: [String], default: [] },
      recommendedActions: { type: [String], default: [] },
      suggestedTeam: { type: String },
    },
    resolution: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

TicketSchema.index({ ticketNumber: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ requester: 1 });
TicketSchema.index({ assignedEngineer: 1 });

export const Ticket = model<ITicket>('Ticket', TicketSchema);
