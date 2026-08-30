import { Schema, model, Document } from 'mongoose';
import { IAsset } from './Asset';
import { IUser } from './User';

export interface IAssetAssignment extends Document {
  asset: Schema.Types.ObjectId | IAsset;
  assignee: Schema.Types.ObjectId | IUser;
  assignedBy: Schema.Types.ObjectId | IUser;
  assignedAt: Date;
  returnedAt?: Date;
  conditionOnAssignment: string;
  conditionOnReturn?: string;
  status: 'Active' | 'Returned';
}

const AssetAssignmentSchema = new Schema<IAssetAssignment>(
  {
    asset: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    returnedAt: {
      type: Date,
    },
    conditionOnAssignment: {
      type: String,
      required: true,
      default: 'Good',
    },
    conditionOnReturn: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Active', 'Returned'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

AssetAssignmentSchema.index({ asset: 1, assignee: 1 });
AssetAssignmentSchema.index({ status: 1 });

export const AssetAssignment = model<IAssetAssignment>('AssetAssignment', AssetAssignmentSchema);
