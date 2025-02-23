const express = require("express");
const multer = require("multer");
const Ebook = require("../models/Ebook.js");
const fs = require("fs");
const path = require("path");
const { extractTextFromEPUB } = require("../utils/extractText.js");

const router = express.Router();

// 📂 Configure Multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage to avoid temporary files

// 📚 Upload and Save an Ebook
const upload = multer({ storage });

router.post("/", upload.single("file"), async (req, res) => {
    try {
        console.log("📥 Received Form Data AFTER Multer:", req.body); // ✅ Debugging
        console.log("📂 Uploaded File:", req.file); // ✅ Access file correctly

        if (!req.body.title || !req.body.author) {
            return res.status(400).json({ error: "Missing title or author" });
        }

        const title = req.body.title
            ? req.body.title.replace(/\s+/g, "_").toLowerCase().replace(/[^a-z0-9_]/gi, "")
            : "untitled";

        const author = req.body.author
            ? req.body.author.replace(/\s+/g, "_").toLowerCase().replace(/[^a-z0-9_]/gi, "")
            : "unknown_author";

        const authorFolder = `/mnt/sandisk/media/library/${author}`;
        try {
            await fs.promises.mkdir(authorFolder, { recursive: true });
            console.log(`📂 Created folder for author: ${authorFolder}`);

            const newPath = path.join(authorFolder, `${title}_${author}_${Date.now()}${path.extname(req.file.originalname)}`);
            await fs.promises.writeFile(newPath, req.file.buffer);
            console.log(`📂 Saved file to: ${newPath}`);

            const fileFormat = path.extname(newPath).replace(".", "");

            const newEbook = await Ebook.create({
                title: req.body.title,
                author: req.body.author,
                genre: req.body.genre || "Unknown",
                language: req.body.language || "Unknown",
                filePath: newPath.trim(),
                fileFormat,
            });

            res.status(201).json(newEbook);
        } catch (err) {
            console.error(`❌ Error creating folder or saving file: ${err}`);
            res.status(500).json({ error: err.message });
        }
    } catch (err) {
        console.error("❌ Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// 📖 Get All Ebooks (Metadata Only)
router.get("/", async (req, res) => {
    try {
        const ebooks = await Ebook.find();
        res.json(ebooks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🧠 Get AI-Processed Summary, Highlights, and Mind Map
router.get("/:id/ai-summary", async (req, res) => {
    try {
        const ebook = await Ebook.findById(req.params.id);
        if (!ebook) return res.status(404).json({ error: "Ebook not found" });

        res.json({
            title: ebook.title,
            author: ebook.author,
            summary: ebook.aiSummary,
            highlights: ebook.highlights,
            mindMap: ebook.mindMap,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🚮 Delete Ebook (File + Metadata)
router.delete("/:id", async (req, res) => {
    try {
        const ebook = await Ebook.findById(req.params.id);
        if (!ebook) return res.status(404).json({ error: "Ebook not found" });

        // Remove book file from disk
        if (fs.existsSync(ebook.filePath)) {
            fs.unlinkSync(ebook.filePath);
        }

        // Remove metadata from MongoDB
        await Ebook.findByIdAndDelete(req.params.id);

        res.json({ message: "Ebook deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📖 Extract text from an EPUB file
router.get("/:id/extract", async (req, res) => {
    try {
        console.log("📥 Received request to extract text for ID:", req.params.id);

        // Fetch ebook metadata
        const ebook = await Ebook.findById(req.params.id);
        console.log("📖 Ebook from database:", ebook);

        if (!ebook) return res.status(404).json({ error: "Ebook not found" });

        if (ebook.fileFormat !== "epub") {
            return res.status(400).json({ error: "Only EPUB files can be processed." });
        }

        // Debugging: Print the expected file path
        console.log("📂 Expected file path:", ebook.filePath);

        // Normalize path to avoid encoding issues
        const filePath = path.resolve(ebook.filePath.trim());
        console.log("🔍 Checking actual resolved file path:", filePath);

        // Check if the file exists
        try {
            await fs.promises.access(filePath);
        } catch {
            console.log("❌ File does NOT exist on the server:", filePath);
            return res.status(404).json({ error: "File not found on server" });
        }

        // Extract text
        console.log("📖 Extracting text from:", filePath);
        const text = await extractTextFromEPUB(filePath);
        console.log('text', text)

        res.json({ title: ebook.title, author: ebook.author, extractedText: text });
    } catch (error) {
        console.error("❌ Extraction Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;