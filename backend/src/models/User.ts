import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IRole } from './Role';
import { IDepartment } from './Department';
import { ILocation } from './Location';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: Schema.Types.ObjectId | IRole;
  department?: Schema.Types.ObjectId | IDepartment;
  location?: Schema.Types.ObjectId | ILocation;
  status: 'Active' | 'Inactive' | 'Suspended';
  refreshTokens: string[];
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password if it's new or modified
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>('User', UserSchema);
