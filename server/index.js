import express from "express";
import cors from "cors";
import {
  getProducts,
  setProducts,
  getSupportThreads,
  getSupportThreadById,
  upsertSupportThread,
} from "./db.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/products", async (_req, res) => {
  const products = await getProducts();
  res.json({ products });
});

app.put("/api/products", async (req, res) => {
  const products = Array.isArray(req.body?.products) ? req.body.products : [];
  const result = await setProducts(products);
  res.json({ ok: true, ...result });
});

app.get("/api/support/threads", async (_req, res) => {
  const threads = await getSupportThreads();
  res.json({ threads });
});

app.post("/api/support/threads", async (req, res) => {
  const { topic, message, name, email } = req.body || {};
  const text = String(message || "").trim();
  if (!text) return res.status(400).json({ error: "Message is required." });
  const now = new Date().toISOString();
  const thread = {
    id: `thread-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    topic: topic || "other",
    status: "new",
    userName: String(name || "Customer").trim(),
    userEmail: String(email || "").trim().toLowerCase(),
    createdAt: now,
    updatedAt: now,
    unreadUser: 0,
    unreadAdmin: 1,
    messages: [
      {
        id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        authorType: "user",
        authorName: String(name || "Customer").trim(),
        text,
        at: now,
      },
    ],
  };
  await upsertSupportThread(thread);
  res.json({ thread });
});

app.post("/api/support/threads/:id/replies", async (req, res) => {
  const threadId = req.params.id;
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "Message is required." });
  const existing = await getSupportThreadById(threadId);
  if (!existing) return res.status(404).json({ error: "Thread not found." });

  const now = new Date().toISOString();
  const authorType = req.body?.authorType === "admin" ? "admin" : "user";
  const authorName = String(req.body?.authorName || (authorType === "admin" ? "Admin" : existing.userName || "Customer")).trim();

  const updated = {
    ...existing,
    status: existing.status === "done" ? "processing" : existing.status || "processing",
    updatedAt: now,
    unreadAdmin: authorType === "user" ? Number(existing.unreadAdmin || 0) + 1 : Number(existing.unreadAdmin || 0),
    unreadUser: authorType === "admin" ? Number(existing.unreadUser || 0) + 1 : Number(existing.unreadUser || 0),
    messages: [
      ...(Array.isArray(existing.messages) ? existing.messages : []),
      {
        id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        authorType,
        authorName,
        text,
        at: now,
      },
    ],
  };
  await upsertSupportThread(updated);
  res.json({ thread: updated });
});

app.patch("/api/support/threads/:id", async (req, res) => {
  const threadId = req.params.id;
  const existing = await getSupportThreadById(threadId);
  if (!existing) return res.status(404).json({ error: "Thread not found." });

  const next = {
    ...existing,
    status: req.body?.status || existing.status,
    unreadUser: Number.isFinite(req.body?.unreadUser) ? req.body.unreadUser : existing.unreadUser,
    unreadAdmin: Number.isFinite(req.body?.unreadAdmin) ? req.body.unreadAdmin : existing.unreadAdmin,
  };
  await upsertSupportThread(next);
  res.json({ thread: next });
});

app.listen(PORT, () => {
  console.log(`Toy Store API running on port ${PORT}`);
});
