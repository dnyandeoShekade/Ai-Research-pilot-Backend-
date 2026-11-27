const test = require("node:test");
const assert = require("node:assert/strict");

const { cosineSimilarity } = require("../utils/retrievalService");
const chunkText = require("../utils/textChunker");
const { createRateLimiter } = require("../middleware/rateLimiter");
const { validateAgentInput } = require("../middleware/validator");
const { documentSearchTool } = require("../tools/documentSearchTool");
const { webSearchTool } = require("../tools/webSearchTool");

test("Vector Cosine Similarity", async (t) => {
  await t.test("returns 1.0 for identical vectors", () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    const sim = cosineSimilarity(v1, v2);
    assert.ok(Math.abs(sim - 1.0) < 0.0001);
  });

  await t.test("returns 0 for orthogonal vectors", () => {
    const v1 = [1, 0, 0];
    const v2 = [0, 1, 0];
    const sim = cosineSimilarity(v1, v2);
    assert.equal(sim, 0);
  });

  await t.test("safely handles empty or mismatched vectors", () => {
    assert.equal(cosineSimilarity([], []), 0);
    assert.equal(cosineSimilarity([1, 2], [1, 2, 3]), 0);
    assert.equal(cosineSimilarity(null, [1]), 0);
  });
});

test("Text Chunker (RAG Data Pipeline)", async (t) => {
  await t.test("chunks text with overlap correctly", () => {
    const text = "A".repeat(500);
    const chunks = chunkText(text, 200, 50);
    assert.ok(chunks.length > 1);
    assert.equal(chunks[0].pageNumber, 1);
    assert.equal(chunks[0].index, 0);
  });

  await t.test("throws error if overlap >= chunkSize", () => {
    assert.throws(() => {
      chunkText("test", 100, 100);
    }, /Overlap must be smaller than chunk size/);
  });

  await t.test("handles empty text gracefully", () => {
    assert.deepEqual(chunkText(""), []);
    assert.deepEqual(chunkText(null), []);
  });
});

test("Rate Limiter Middleware", async (t) => {
  await t.test("blocks requests once limit is exceeded", () => {
    const limiter = createRateLimiter({ windowMs: 10000, maxRequests: 2 });
    const req = { ip: "127.0.0.1" };
    let status = 200;
    let jsonBody = null;
    const res = {
      status(s) {
        status = s;
        return this;
      },
      json(body) {
        jsonBody = body;
      },
    };

    let nextCalled = 0;
    const next = () => {
      nextCalled++;
    };

    limiter(req, res, next);
    limiter(req, res, next);
    assert.equal(nextCalled, 2);

    // 3rd call should trigger 429
    limiter(req, res, next);
    assert.equal(status, 429);
    assert.equal(jsonBody.success, false);
  });
});

test("Agent Input Validation Middleware", async (t) => {
  await t.test("rejects missing question", () => {
    const req = { body: {} };
    let statusCode = 200;
    const res = {
      status(s) {
        statusCode = s;
        return this;
      },
      json() {},
    };
    validateAgentInput(req, res, () => {});
    assert.equal(statusCode, 400);
  });

  await t.test("rejects invalid documentId format", () => {
    const req = { body: { question: "What is RAG?", documentId: "invalid-id" } };
    let statusCode = 200;
    const res = {
      status(s) {
        statusCode = s;
        return this;
      },
      json() {},
    };
    validateAgentInput(req, res, () => {});
    assert.equal(statusCode, 400);
  });

  await t.test("passes with clean question and valid documentId", () => {
    const req = { body: { question: "  What is RAG?  ", documentId: "507f1f77bcf86cd799439011" } };
    let called = false;
    const res = {};
    validateAgentInput(req, res, () => {
      called = true;
    });
    assert.equal(called, true);
    assert.equal(req.body.question, "What is RAG?");
  });
});

test("Agent Tool Declarations", async (t) => {
  await t.test("tools are exported as callable async functions", () => {
    assert.equal(typeof documentSearchTool, "function");
    assert.equal(typeof webSearchTool, "function");
  });
});
