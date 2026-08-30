import { Schema, model, Document } from 'mongoose';

export const SLAPriorities = ['Low', 'Medium', 'High', 'Critical'] as const;

export interface ISLA extends Document {
  priority: typeof SLAPriorities[number];
  responseTime: number; // in minutes
  resolutionTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

const SLASchema = new Schema<ISLA>(
  {
    priority: {
      type: String,
      required: true,
      unique: true,
      enum: SLAPriorities,
    },
    responseTime: {
      type: Number,
      required: true, // e.g. 15 minutes for Critical
      min: 1,
    },
    resolutionTime: {
      type: Number,
      required: true, // e.g. 120 minutes (2 hrs) for Critical
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const SLA = model<ISLA>('SLA', SLASchema);
