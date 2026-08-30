import { Schema, model, Document } from 'mongoose';
import { IAsset } from './Asset';
import { IUser } from './User';
import { IVendor } from './Vendor';

export const MaintenanceTypes = ['Preventive', 'Corrective', 'Vendor', 'AMC'] as const;
export const MaintenanceStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'] as const;

export interface IMaintenance extends Document {
  asset: Schema.Types.ObjectId | IAsset;
  maintenanceType: typeof MaintenanceTypes[number];
  scheduledDate: Date;
  assignedEngineer?: Schema.Types.ObjectId | IUser;
  vendor?: Schema.Types.ObjectId | IVendor;
  status: typeof MaintenanceStatuses[number];
  notes?: string;
  cost?: number;
  nextMaintenanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    asset: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    maintenanceType: {
      type: String,
      required: true,
      enum: MaintenanceTypes,
      default: 'Preventive',
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    assignedEngineer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    status: {
      type: String,
      required: true,
      enum: MaintenanceStatuses,
      default: 'Scheduled',
    },
    notes: {
      type: String,
      default: '',
    },
    cost: {
      type: Number,
      min: 0,
    },
    nextMaintenanceDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

MaintenanceSchema.index({ asset: 1, scheduledDate: 1 });
MaintenanceSchema.index({ status: 1 });

export const Maintenance = model<IMaintenance>('Maintenance', MaintenanceSchema);
