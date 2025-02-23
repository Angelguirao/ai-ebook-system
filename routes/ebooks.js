const express = require("express");
const multer = require("multer");
const Ebook = require("../models/Ebook.js");
const fs = require("fs");
const path = require("path");
const { extractTextFromEPUB } = require("../utils/extractText.js");

const router = express.Router();

// 📂 Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "/mnt/sandisk/media/library/"); // Save books inside SanDisk
    },
    filename: (req, file, cb) => {
        console.log("📥 Received Form Data Inside Multer:", req.body); // ✅ Debugging

        setTimeout(() => {
            const title = req.body.title
                ? req.body.title.replace(/\s+/g, "_").toLowerCase().replace(/[^a-z0-9_]/gi, "")
                : "untitled";

            const author = req.body.author
                ? req.body.author.replace(/\s+/g, "_").toLowerCase().replace(/[^a-z0-9_]/gi, "")
                : "unknown_author";

            const timestamp = Date.now();
            const ext = path.extname(file.originalname);
            const simpleFilename = `${title}_${author}_${timestamp}${ext}`;

            console.log("📂 Saving file as:", simpleFilename); // ✅ Debugging

            cb(null, simpleFilename);
        }, 10); // Small delay to ensure `req.body` is available
    },
});

// 📚 Upload and Save an Ebook
const upload = multer({ storage });

router.post("/", upload.fields([{ name: "file", maxCount: 1 }]), async (req, res) => {
    try {
        console.log("📥 Received Form Data AFTER Multer:", req.body); // ✅ Debugging
        console.log("📂 Uploaded File:", req.files.file[0]); // ✅ Access file correctly

        if (!req.body.title || !req.body.author) {
            return res.status(400).json({ error: "Missing title or author" });
        }

        const fileFormat = path.extname(req.files.file[0].filename).replace(".", "");

        const newEbook = await Ebook.create({
            title: req.body.title,
            author: req.body.author,
            genre: req.body.genre || "Unknown",
            language: req.body.language || "Unknown",
            filePath: req.files.file[0].path.trim(),
            fileFormat,
        });

        res.status(201).json(newEbook);
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