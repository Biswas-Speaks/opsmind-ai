import { Schema, model, Document } from 'mongoose';
import { IVendor } from './Vendor';
import { ILocation } from './Location';
import { IDepartment } from './Department';
import { IUser } from './User';

export const AssetCategories = [
  'Laptop',
  'Desktop',
  'Server',
  'Monitor',
  'Printer',
  'Network Switch',
  'Router',
  'Firewall',
  'Access Point',
  'CCTV Camera',
  'NVR',
  'UPS',
  'Storage',
  'Mobile Device',
  'Software License',
  'Other',
] as const;

export const AssetStatuses = [
  'Available',
  'Assigned',
  'In Use',
  'Under Maintenance',
  'Repair',
  'Lost',
  'Retired',
  'Disposed',
] as const;

export const AssetConditions = ['New', 'Good', 'Fair', 'Poor'] as const;

export interface IAsset {
  assetTag: string;
  serialNumber: string;
  category: typeof AssetCategories[number];
  manufacturer: string;
  model: string;
  description: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  vendor?: Schema.Types.ObjectId | IVendor;
  warrantyStart?: Date;
  warrantyEnd?: Date;
  amcStart?: Date;
  amcEnd?: Date;
  location?: Schema.Types.ObjectId | ILocation;
  department?: Schema.Types.ObjectId | IDepartment;
  assignedUser?: Schema.Types.ObjectId | IUser;
  status: typeof AssetStatuses[number];
  condition: typeof AssetConditions[number];
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  parentAsset?: Schema.Types.ObjectId | IAsset;
  notes?: string;
  documents?: string[];
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    assetTag: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: AssetCategories,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    purchaseDate: {
      type: Date,
    },
    purchaseCost: {
      type: Number,
      min: 0,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    warrantyStart: {
      type: Date,
    },
    warrantyEnd: {
      type: Date,
    },
    amcStart: {
      type: Date,
    },
    amcEnd: {
      type: Date,
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    assignedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      required: true,
      enum: AssetStatuses,
      default: 'Available',
    },
    condition: {
      type: String,
      required: true,
      enum: AssetConditions,
      default: 'New',
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    macAddress: {
      type: String,
      trim: true,
    },
    hostname: {
      type: String,
      trim: true,
    },
    parentAsset: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
    },
    notes: {
      type: String,
      default: '',
    },
    documents: {
      type: [String],
      default: [],
    },
    photos: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast global and category filtering
AssetSchema.index({ assetTag: 1 });
AssetSchema.index({ serialNumber: 1 });
AssetSchema.index({ category: 1 });
AssetSchema.index({ status: 1 });

export const Asset = model<IAsset>('Asset', AssetSchema);
