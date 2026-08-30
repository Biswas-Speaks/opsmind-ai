import { Schema, model, Document } from 'mongoose';
import { ITicket } from './Ticket';
import { IUser } from './User';

export interface ITicketWorklog extends Document {
  ticket: Schema.Types.ObjectId | ITicket;
  engineer: Schema.Types.ObjectId | IUser;
  timeSpent: number; // in minutes
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketWorklogSchema = new Schema<ITicketWorklog>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    engineer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 1, // at least 1 minute
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

TicketWorklogSchema.index({ ticket: 1 });

export const TicketWorklog = model<ITicketWorklog>('TicketWorklog', TicketWorklogSchema);
