import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-ebook-system';

const connectToDatabase = async () => {
    try {
        await mongoose.connect(dbUri);
        console.log("✅ MongoDB Connected Successfully!");
        await mongoose.connection.close();
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
};

connectToDatabase();