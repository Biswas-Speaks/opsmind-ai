import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';

export const NotificationTypes = ['Ticket', 'SLA', 'Camera', 'Warranty', 'Maintenance'] as const;

export interface INotification extends Document {
  recipient: Schema.Types.ObjectId | IUser;
  title: string;
  message: string;
  type: typeof NotificationTypes[number];
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: NotificationTypes,
      default: 'Ticket',
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = model<INotification>('Notification', NotificationSchema);
