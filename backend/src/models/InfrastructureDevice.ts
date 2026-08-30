import { Schema, model, Document } from 'mongoose';
import { ILocation } from './Location';

export const DeviceCategories = ['CCTV Camera', 'NVR', 'Network Switch', 'UPS', 'Server'] as const;
export const DeviceStatuses = ['Online', 'Offline', 'Degraded', 'Unknown'] as const;

export interface IInfrastructureDevice extends Document {
  name: string;
  category: typeof DeviceCategories[number];
  ipAddress: string;
  macAddress?: string;
  status: typeof DeviceStatuses[number];
  location: Schema.Types.ObjectId | ILocation;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InfrastructureDeviceSchema = new Schema<IInfrastructureDevice>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: DeviceCategories,
      default: 'CCTV Camera',
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },
    macAddress: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: DeviceStatuses,
      default: 'Online',
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

InfrastructureDeviceSchema.index({ status: 1 });
InfrastructureDeviceSchema.index({ location: 1 });

export const InfrastructureDevice = model<IInfrastructureDevice>('InfrastructureDevice', InfrastructureDeviceSchema);
