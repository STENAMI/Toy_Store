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
    `);
    return db;
  });
  return dbPromise;
}

export async function getProducts() {
  const db = await initDb();
  const row = await db.get("SELECT data FROM products WHERE id = 'catalog'");
  if (!row?.data) return [];
  try {
    return JSON.parse(row.data);
  } catch {
    return [];
  }
}

export async function setProducts(products) {
  const db = await initDb();
  const now = new Date().toISOString();
  const payload = JSON.stringify(Array.isArray(products) ? products : []);
  await db.run(
    "INSERT INTO products (id, data, updated_at) VALUES ('catalog', ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    payload,
    now
  );
  return { products: JSON.parse(payload), updatedAt: now };
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
