import { Schema, model, Document } from 'mongoose';
import { ITicket } from './Ticket';
import { IUser } from './User';

export interface ITicketComment extends Document {
  ticket: Schema.Types.ObjectId | ITicket;
  author: Schema.Types.ObjectId | IUser;
  content: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketCommentSchema = new Schema<ITicketComment>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

TicketCommentSchema.index({ ticket: 1, createdAt: 1 });

export const TicketComment = model<ITicketComment>('TicketComment', TicketCommentSchema);
