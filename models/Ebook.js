import mongoose from "mongoose";

const EbookSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        author: { type: String, required: true },
        summary: { type: String, default: "" },
        content: { type: String, default: "" }, // Store full book content (optional)
    },
    { timestamps: true } // Auto-manage createdAt and updatedAt
);

export default mongoose.model("Ebook", EbookSchema);
