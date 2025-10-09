import mongoose from 'mongoose';
import { Note } from '../models/note.js';

export const connectMongoDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    await mongoose.connect(mongoUrl);

    console.log('✅ MongoDB connection established successfully');

    await Note.syncIndexes();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
