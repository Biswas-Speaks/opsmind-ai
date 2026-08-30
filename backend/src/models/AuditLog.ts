import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';

export interface IAuditLog extends Document {
  user?: Schema.Types.ObjectId | IUser;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entity: {
      type: String,
      required: true,
      trim: true,
    },
    entityId: {
      type: String,
      trim: true,
    },
    oldValue: {
      type: String,
      default: '',
    },
    newValue: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ user: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
