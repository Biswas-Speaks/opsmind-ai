import mongoose from 'mongoose';

export const connectDB = async (): Promise<typeof mongoose> => {
  const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/opsmind-ai';
  
  try {
    const conn = await mongoose.connect(dbUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${(error as Error).message}`);
    process.exit(1);
  }
};
