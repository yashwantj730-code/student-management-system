// Tiny storage layer: MongoDB when MONGODB_URI is set, otherwise a local JSON file.
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";

export const COLLECTIONS = ["meta", "users", "students", "attendance", "marks", "payments"];
const matches = (doc, filter) => Object.entries(filter).every(([k, v]) => doc[k] === v);

async function mongoStore(uri) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db();
  const c = name => db.collection(name);
  const opts = { projection: { _id: 0 } };
  await Promise.all([
    c("students").createIndex({ id: 1 }, { unique: true }),
    c("attendance").createIndex({ course: 1, semester: 1, date: 1 }),
    c("marks").createIndex({ studentId: 1 }),
    c("payments").createIndex({ studentId: 1 }),
    c("users").createIndex({ email: 1 })
  ]);
  return {
    kind: "mongodb",
    find: (n, f = {}) => c(n).find(f, opts).toArray(),
    findOne: (n, f) => c(n).findOne(f, opts),
    insertOne: async (n, d) => { await c(n).insertOne({ ...d }); return d; },
    insertMany: async (n, ds) => { if (ds.length) await c(n).insertMany(ds.map(d => ({ ...d }))); },
    updateOne: async (n, f, set) => (await c(n).updateOne(f, { $set: set })).matchedCount > 0,
    upsert: async (n, f, d) => { await c(n).replaceOne(f, { ...d }, { upsert: true }); },
    deleteOne: async (n, f) => (await c(n).deleteOne(f)).deletedCount > 0,
    deleteMany: async (n, f = {}) => { await c(n).deleteMany(f); },
    count: (n, f = {}) => c(n).countDocuments(f)
  };
}

function fileStore(file) {
  let data = {};
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch { data = {}; }
  COLLECTIONS.forEach(n => { if (!Array.isArray(data[n])) data[n] = []; });
  const save = () => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data)); };
  const copy = d => (d ? structuredClone(d) : d);
  return {
    kind: "file",
    find: async (n, f = {}) => data[n].filter(d => matches(d, f)).map(copy),
    findOne: async (n, f) => copy(data[n].find(d => matches(d, f)) || null),
    insertOne: async (n, d) => { data[n].push(copy(d)); save(); return d; },
    insertMany: async (n, ds) => { data[n].push(...ds.map(copy)); save(); },
    updateOne: async (n, f, set) => {
      const d = data[n].find(x => matches(x, f)); if (!d) return false;
      Object.assign(d, copy(set)); save(); return true;
    },
    upsert: async (n, f, doc) => {
      const i = data[n].findIndex(x => matches(x, f));
      if (i >= 0) data[n][i] = copy(doc); else data[n].push(copy(doc)); save();
    },
    deleteOne: async (n, f) => {
      const i = data[n].findIndex(x => matches(x, f)); if (i < 0) return false;
      data[n].splice(i, 1); save(); return true;
    },
    deleteMany: async (n, f = {}) => { data[n] = data[n].filter(d => !matches(d, f)); save(); },
    count: async (n, f = {}) => data[n].filter(d => matches(d, f)).length
  };
}

export async function createStore({ uri, file }) {
  if (uri) {
    try {
      const s = await mongoStore(uri);
      console.log("Storage: MongoDB connected");
      return s;
    } catch (e) {
      console.error("MongoDB connection failed, using local file storage:", e.message);
    }
  }
  console.log("Storage: local JSON file", file);
  return fileStore(file);
}
