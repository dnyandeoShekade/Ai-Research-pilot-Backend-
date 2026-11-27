const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../app");

let server;
let baseUrl;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, raw: data, headers: res.headers });
          }
        });
      }
    );
    req.on("error", reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

test("Backend HTTP Endpoint Integration Tests", async (t) => {
  // Start server on an ephemeral port (port 0)
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  t.after(() => {
    server.close();
  });

  await t.test("GET /healthz returns 200 OK", async () => {
    const res = await makeRequest("/healthz");
    assert.equal(res.status, 200);
    assert.equal(res.data.status, "ok");
    assert.ok(res.data.timestamp);
  });

  await t.test("GET /api/health returns system and service status", async () => {
    const res = await makeRequest("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok("services" in res.data);
  });

  await t.test("GET /api/models returns available models list", async () => {
    const res = await makeRequest("/api/models");
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.models));
    assert.ok(res.data.models.length >= 3);
  });

  await t.test("GET /api/metrics tracks telemetry and latencies", async () => {
    const res = await makeRequest("/api/metrics");
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.metrics.totalRequests > 0);
  });

  await t.test("POST /api/agent validates input and rejects missing question", async () => {
    const res = await makeRequest("/api/agent", {
      method: "POST",
      body: {},
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.equal(res.data.error, "Question must be a non-empty string.");
  });

  await t.test("POST /api/agent rejects invalid documentId format", async () => {
    const res = await makeRequest("/api/agent", {
      method: "POST",
      body: { question: "Summarize this paper", documentId: "123-not-valid" },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
    assert.match(res.data.error, /Invalid documentId format/);
  });

  await t.test("POST /api/documents/ask rejects invalid documentId", async () => {
    const res = await makeRequest("/api/documents/ask", {
      method: "POST",
      body: { question: "What is this paper about?", documentId: "invalid_id" },
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });
});
