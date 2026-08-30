import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';

// Knowledge Document Model
export interface IKnowledgeDocument extends Document {
  title: string;
  category: string;
  tags: string[];
  filePath?: string;
  createdBy?: Schema.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'General',
    },
    tags: {
      type: [String],
      default: [],
    },
    filePath: {
      type: String,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const KnowledgeDocument = model<IKnowledgeDocument>('KnowledgeDocument', KnowledgeDocumentSchema);

// Knowledge Chunk Model (For RAG/Vector Embedding storage)
export interface IKnowledgeChunk extends Document {
  document: Schema.Types.ObjectId | IKnowledgeDocument;
  content: string;
  chunkIndex: number;
  embedding: number[]; // Float array for vectors
  createdAt: Date;
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    embedding: {
      type: [Number], // Float vector field
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

KnowledgeChunkSchema.index({ document: 1 });

export const KnowledgeChunk = model<IKnowledgeChunk>('KnowledgeChunk', KnowledgeChunkSchema);
