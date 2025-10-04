import mongoose from 'mongoose';

export default async function connectMongoDB() {
  try {
    const mongoURL = process.env.MONGODB_URL;
    await mongoose.connect(mongoURL);
    console.log('✅ MongoDB connection established successfully');
  } catch {
    console.error('❌ Not connected to MongoDB');
    process.exit(1);
  }
}
