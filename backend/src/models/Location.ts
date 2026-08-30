import { Schema, model, Document } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  code: string;
  address: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    address: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'Office',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Location = model<ILocation>('Location', LocationSchema);
