const mongoose = require("mongoose");

const EbookSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        author: { type: String, required: true },
        genre: { type: String, default: "Unknown" }, // Optional: Fiction, Philosophy, Science, etc.
        filePath: { type: String, required: true }, // Full path to file on your SanDisk
        fileFormat: { type: String, enum: ["pdf", "epub", "txt"], required: true }, // Book format
        language: { type: String, default: "Unknown" }, // Book language

        // 📖 AI-Generated Summaries & Insights
        aiSummary: {
            fullSummary: { type: String, default: "" }, // Full AI-generated summary
            shortSummary: { type: String, default: "" }, // 1-paragraph summary
            keyTakeaways: { type: [String], default: [] }, // List of key ideas
            chapterSummaries: { type: [String], default: [] }, // Summaries per chapter
            keyConcepts: { type: [String], default: [] }, // Extracted concepts
        },

        // ✨ AI-Generated Highlights
        highlights: { type: [String], default: [] }, // Extracted key quotes/sentences
        sentimentAnalysis: {
            overallSentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" }, // AI-detected mood
            emotionalKeywords: { type: [String], default: [] }, // AI-extracted emotions
        },

        // 🧠 AI-Generated Mind Map (Graph Structure)
        mindMap: {
            nodes: { type: [String], default: [] }, // Concepts as nodes
            edges: { type: [[String]], default: [] }, // Relationships between concepts
        },

        // 🕒 Metadata
        addedAt: { type: Date, default: Date.now }, // When book was added
        lastProcessed: { type: Date }, // Last time AI generated insights
    },
    { timestamps: true } // Automatically stores createdAt and updatedAt
);

module.exports = mongoose.model("Ebook", EbookSchema);