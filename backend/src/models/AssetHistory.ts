import { Schema, model, Document } from 'mongoose';
import { IAsset } from './Asset';
import { IUser } from './User';

export interface IAssetHistory extends Document {
  asset: Schema.Types.ObjectId | IAsset;
  action: string;
  oldValue: string;
  newValue: string;
  operator?: Schema.Types.ObjectId | IUser;
  timestamp: Date;
}

const AssetHistorySchema = new Schema<IAssetHistory>(
  {
    asset: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    action: {
      type: String,
      required: true,
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
    operator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Explicitly false as we use timestamp field
  }
);

AssetHistorySchema.index({ asset: 1, timestamp: -1 });

export const AssetHistory = model<IAssetHistory>('AssetHistory', AssetHistorySchema);
