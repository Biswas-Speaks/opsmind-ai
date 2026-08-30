import { Schema, model, Document } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  services: string[];
  rating: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    services: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Vendor = model<IVendor>('Vendor', VendorSchema);
