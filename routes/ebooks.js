import express from "express";
import Ebook from "../models/Ebook.js";

const router = express.Router();

// 📚 Add a new ebook
router.post("/", async (req, res) => {
    try {
        const newEbook = await Ebook.create(req.body);
        res.status(201).json(newEbook);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📖 Get all ebooks
router.get("/", async (req, res) => {
    try {
        const ebooks = await Ebook.find();
        res.json(ebooks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ❌ Delete an ebook by ID
router.delete("/:id", async (req, res) => {
    try {
        await Ebook.findByIdAndDelete(req.params.id);
        res.json({ message: "Ebook deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;


