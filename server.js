const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const ebookRoutes = require("./routes/ebooks.js");

dotenv.config();

const app = express();

// Middleware

// ✅ Ensure Express Parses JSON & Form Data
app.use(cors()); // Enable CORS
app.use(express.json()); // Parses application/json
app.use(express.urlencoded({ extended: true })); // Parses form-urlencoded data

// 📂 Serve ebooks from SanDisk drive
app.use("/books", express.static("/mnt/sandisk/media/library/"))

// API Routes
app.use("/api/ebooks", ebookRoutes);

app.get("/", (req, res) => res.send("📚 AI Ebook System API is Running!"));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-ebook-system";

const connectToDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
};

connectToDatabase();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));