import mongoose from "mongoose";

export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME,
  });
  console.log(`Connected to MongoDB (${process.env.MONGODB_DB_NAME})`);
}
