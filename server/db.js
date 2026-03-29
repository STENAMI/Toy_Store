import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbPromise;

async function initDb() {
  if (dbPromise) return dbPromise;
  dbPromise = open({
    filename: path.join(__dirname, "data.sqlite"),
    driver: sqlite3.Database,
  }).then(async (db) => {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS support_threads (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS user_data (
        email TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    return db;
  });
  return dbPromise;
}

export async function getProducts() {
  const db = await initDb();
  const row = await db.get("SELECT data, updated_at FROM products WHERE id = 'catalog'");
  if (!row?.data) return { products: [], updatedAt: 0 };
  try {
    return { products: JSON.parse(row.data), updatedAt: Date.parse(row.updated_at || "") || 0 };
  } catch {
    return { products: [], updatedAt: 0 };
  }
}

export async function setProducts(products, updatedAt) {
  const db = await initDb();
  const now = updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString();
  const payload = JSON.stringify(Array.isArray(products) ? products : []);
  await db.run(
    "INSERT INTO products (id, data, updated_at) VALUES ('catalog', ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    payload,
    now
  );
  return { products: JSON.parse(payload), updatedAt: Date.parse(now) || 0 };
}

export async function getSupportThreads() {
  const db = await initDb();
  const rows = await db.all("SELECT data FROM support_threads ORDER BY updated_at DESC");
  return rows
    .map((row) => {
      try {
        return JSON.parse(row.data);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export async function getSupportThreadById(threadId) {
  const db = await initDb();
  const row = await db.get("SELECT data FROM support_threads WHERE id = ?", threadId);
  if (!row?.data) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export async function upsertSupportThread(thread) {
  const db = await initDb();
  const now = new Date().toISOString();
  const payload = JSON.stringify(thread);
  await db.run(
    "INSERT INTO support_threads (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    thread.id,
    payload,
    now
  );
  return thread;
}

export async function deleteAllSupportThreads() {
  const db = await initDb();
  await db.run("DELETE FROM support_threads");
}

export async function deleteAllProducts() {
  const db = await initDb();
  await db.run("DELETE FROM products");
}

export async function getOrders() {
  const db = await initDb();
  const row = await db.get("SELECT data, updated_at FROM orders WHERE id = 'orders'");
  if (!row?.data) return { orders: [], updatedAt: 0 };
  try {
    return { orders: JSON.parse(row.data), updatedAt: Date.parse(row.updated_at || "") || 0 };
  } catch {
    return { orders: [], updatedAt: 0 };
  }
}

export async function setOrders(orders, updatedAt) {
  const db = await initDb();
  const now = updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString();
  const payload = JSON.stringify(Array.isArray(orders) ? orders : []);
  await db.run(
    "INSERT INTO orders (id, data, updated_at) VALUES ('orders', ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    payload,
    now
  );
  return { orders: JSON.parse(payload), updatedAt: Date.parse(now) || 0 };
}

export async function appendOrder(order) {
  const existing = await getOrders();
  const orders = Array.isArray(existing.orders) ? existing.orders : [];
  orders.push(order);
  return setOrders(orders, Date.now());
}

export async function updateOrder(orderId, patch) {
  const existing = await getOrders();
  const orders = Array.isArray(existing.orders) ? existing.orders : [];
  let updated = null;
  const next = orders.map((order) => {
    if (order.id !== orderId) return order;
    updated = { ...order, ...patch };
    return updated;
  });
  await setOrders(next, Date.now());
  return updated;
}

export async function deleteOrder(orderId) {
  const existing = await getOrders();
  const orders = Array.isArray(existing.orders) ? existing.orders : [];
  const next = orders.filter((order) => order.id !== orderId);
  await setOrders(next, Date.now());
  return next;
}

export async function getUsers() {
  const db = await initDb();
  const rows = await db.all("SELECT data FROM users ORDER BY updated_at DESC");
  return rows
    .map((row) => {
      try {
        return JSON.parse(row.data);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export async function getUserByEmail(email) {
  const db = await initDb();
  const row = await db.get("SELECT data FROM users WHERE email = ?", email);
  if (!row?.data) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export async function upsertUser(user) {
  const db = await initDb();
  const now = new Date().toISOString();
  const payload = JSON.stringify(user);
  await db.run(
    "INSERT INTO users (email, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    user.email,
    payload,
    now
  );
  return user;
}

export async function deleteUser(email) {
  const db = await initDb();
  await db.run("DELETE FROM users WHERE email = ?", email);
}

export async function getUserData(email) {
  const db = await initDb();
  const row = await db.get("SELECT data FROM user_data WHERE email = ?", email);
  if (!row?.data) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export async function upsertUserData(email, data) {
  const db = await initDb();
  const now = new Date().toISOString();
  const payload = JSON.stringify(data || {});
  await db.run(
    "INSERT INTO user_data (email, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    email,
    payload,
    now
  );
  return JSON.parse(payload);
}
