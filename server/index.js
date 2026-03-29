import express from "express";
import cors from "cors";
import {
  getProducts,
  setProducts,
  getOrders,
  appendOrder,
  updateOrder,
  deleteOrder,
  getSupportThreads,
  getSupportThreadById,
  upsertSupportThread,
  getUsers,
  getUserByEmail,
  upsertUser,
  deleteUser,
  getUserData,
  upsertUserData,
} from "./db.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/products", async (_req, res) => {
  const { products, updatedAt } = await getProducts();
  res.json({ products, updatedAt });
});

app.put("/api/products", async (req, res) => {
  const products = Array.isArray(req.body?.products) ? req.body.products : [];
  const updatedAt = Number(req.body?.updatedAt || 0) || Date.now();
  const result = await setProducts(products, updatedAt);
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

app.get("/api/orders", async (_req, res) => {
  const { orders, updatedAt } = await getOrders();
  res.json({ orders, updatedAt });
});

app.post("/api/orders", async (req, res) => {
  const order = req.body?.order;
  if (!order?.id) return res.status(400).json({ error: "Order is required." });
  const result = await appendOrder(order);
  res.json({ ok: true, ...result });
});

app.patch("/api/orders/:id", async (req, res) => {
  const orderId = req.params.id;
  const updated = await updateOrder(orderId, req.body || {});
  if (!updated) return res.status(404).json({ error: "Order not found." });
  res.json({ order: updated });
});

app.delete("/api/orders/:id", async (req, res) => {
  const orderId = req.params.id;
  await deleteOrder(orderId);
  res.json({ ok: true });
});

app.get("/api/users", async (_req, res) => {
  const users = await getUsers();
  res.json({ users });
});

app.post("/api/users/register", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const passwordHash = String(req.body?.passwordHash || "").trim();
  if (!email || !passwordHash) return res.status(400).json({ error: "Email and password are required." });
  const existing = await getUserByEmail(email);
  if (existing) return res.status(409).json({ error: "User already exists." });
  const now = Date.now();
  const user = { name, email, passwordHash, createdAt: now };
  await upsertUser(user);
  res.json({ user: { name: user.name, email: user.email, createdAt: user.createdAt } });
});

app.post("/api/users/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const passwordHash = String(req.body?.passwordHash || "").trim();
  if (!email || !passwordHash) return res.status(400).json({ error: "Email and password are required." });
  const user = await getUserByEmail(email);
  if (!user || user.passwordHash !== passwordHash) return res.status(401).json({ error: "Invalid credentials." });
  res.json({ user: { name: user.name, email: user.email, createdAt: user.createdAt } });
});

app.delete("/api/users/:email", async (req, res) => {
  const email = String(req.params.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });
  await deleteUser(email);
  res.json({ ok: true });
});

app.get("/api/user-data/:email", async (req, res) => {
  const email = String(req.params.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });
  const data = await getUserData(email);
  res.json({ data: data || null });
});

app.put("/api/user-data/:email", async (req, res) => {
  const email = String(req.params.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });
  const payload = req.body || {};
  const data = await upsertUserData(email, payload);
  res.json({ data });
});

app.listen(PORT, () => {
  console.log(`Toy Store API running on port ${PORT}`);
});
