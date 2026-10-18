
const express = require("express");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const chunkText = require("../utils/textChunker");
const Document = require("../models/Document");
const { generateEmbedding } = require("../utils/embeddingService");

const router = express.Router();

// Store uploaded PDFs in memory (maximum 10 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});

// Upload PDF, extract text, generate embeddings, and save to MongoDB
router.post("/upload", upload.single("pdf"), async (req, res) => {
  let parser;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    // Extract PDF text
    parser = new PDFParse({
      data: req.file.buffer,
    });

    const pdfData = await parser.getText();
    const text = pdfData.text.trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "No text found. This PDF may be scanned.",
      });
    }

    // Split the extracted text into chunks
    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No usable text chunks were generated from this PDF.",
      });
    }

    console.log("PDF pages:", pdfData.total);
    console.log("Total characters:", text.length);
    console.log("Total chunks:", chunks.length);

    // Generate an embedding for each chunk
    const chunksWithEmbeddings = [];

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(
        chunk.text,
        "search_document"
      );

      chunksWithEmbeddings.push({
        index: chunk.index,
        text: chunk.text,
        embedding,
      });
    }

    // Save document and embedded chunks to MongoDB
    const savedDocument = await Document.create({
      filename: req.file.originalname,
      pages: pdfData.total,
      characters: text.length,
      totalChunks: chunksWithEmbeddings.length,
      chunks: chunksWithEmbeddings,
    });

    console.log("Document saved:", savedDocument._id);

    return res.status(200).json({
      success: true,
      message: "PDF processed and saved successfully",
      documentId: savedDocument._id,
      filename: savedDocument.filename,
      pages: savedDocument.pages,
      characters: savedDocument.characters,
      totalChunks: savedDocument.totalChunks,
    });
  } catch (error) {
    console.error("PDF processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process PDF",
      error: error.message,
    });
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
});

module.exports = router;
