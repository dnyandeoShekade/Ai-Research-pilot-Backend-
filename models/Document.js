
const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    pages: { type: Number, default: 0 },
    characters: { type: Number, default: 0 },
    totalChunks: { type: Number, default: 0 },
    chunks: { type: [chunkSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
