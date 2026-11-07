import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "students.json");

const SEED = [
  { name: "Aarav Sharma", roll: "BCA2301", course: "BCA", semester: 3, email: "aarav@example.com", phone: "9876500001", attendance: 92, marks: 88 },
  { name: "Priya Verma", roll: "BCA2302", course: "BCA", semester: 3, email: "priya@example.com", phone: "9876500002", attendance: 85, marks: 91 },
  { name: "Rohan Gupta", roll: "BTECH2201", course: "B.Tech", semester: 5, email: "rohan@example.com", phone: "9876500003", attendance: 68, marks: 64 },
  { name: "Sana Khan", roll: "BSC2401", course: "B.Sc", semester: 1, email: "sana@example.com", phone: "9876500004", attendance: 78, marks: 73 },
  { name: "Vikas Yadav", roll: "MCA2501", course: "MCA", semester: 1, email: "vikas@example.com", phone: "9876500005", attendance: 95, marks: 82 },
  { name: "Neha Singh", roll: "BCA2303", course: "BCA", semester: 3, email: "neha@example.com", phone: "9876500006", attendance: 59, marks: 47 }
].map(s => ({ id: randomUUID(), createdAt: new Date().toISOString(), ...s }));

// ---------- Storage: MongoDB if MONGODB_URI is set, else local JSON file ----------
let col = null;
let students = [];
function loadFile() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2)); return [...SEED]; }
}
const saveFile = () => fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
const strip = d => { if (!d) return d; const { _id, ...rest } = d; return rest; };

const db = {
  async all() { return col ? (await col.find({}).sort({ createdAt: -1 }).toArray()).map(strip) : students; },
  async get(id) { return col ? strip(await col.findOne({ id })) : students.find(x => x.id === id); },
  async rollTaken(roll, exceptId) { const list = await this.all(); return list.some(s => s.roll === roll && s.id !== exceptId); },
  async add(s) { if (col) await col.insertOne({ ...s }); else { students.unshift(s); saveFile(); } return s; },
  async update(id, data) {
    if (col) { await col.updateOne({ id }, { $set: data }); return this.get(id); }
    const i = students.findIndex(x => x.id === id); students[i] = { ...students[i], ...data }; saveFile(); return students[i];
  },
  async remove(id) {
    if (col) return (await col.deleteOne({ id })).deletedCount > 0;
    const before = students.length; students = students.filter(x => x.id !== id); saveFile(); return students.length < before;
  }
};

async function initStorage() {
  if (process.env.MONGODB_URI) {
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      col = client.db().collection("students");
      await col.createIndex({ id: 1 }, { unique: true });
      if (await col.countDocuments() === 0) await col.insertMany(SEED.map(s => ({ ...s })));
      console.log("MongoDB connected");
      return;
    } catch (e) { console.error("MongoDB error, falling back to file:", e.message); col = null; }
  }
  students = loadFile();
}

function validate(b, partial = false) {
  const errors = [];
  const need = ["name", "roll", "course", "semester", "email"];
  if (!partial) need.forEach(k => { if (b[k] === undefined || String(b[k]).trim() === "") errors.push(`${k} is required`); });
  if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) errors.push("email is invalid");
  if (b.phone && !/^\d{10}$/.test(String(b.phone))) errors.push("phone must be 10 digits");
  for (const k of ["attendance", "marks"]) if (b[k] !== undefined && b[k] !== "" && (isNaN(b[k]) || b[k] < 0 || b[k] > 100)) errors.push(`${k} must be 0-100`);
  if (b.semester !== undefined && (isNaN(b.semester) || b.semester < 1 || b.semester > 10)) errors.push("semester must be 1-10");
  return errors;
}
const clean = b => ({
  name: String(b.name ?? "").trim(), roll: String(b.roll ?? "").trim().toUpperCase(), course: String(b.course ?? "").trim(),
  semester: Number(b.semester), email: String(b.email ?? "").trim().toLowerCase(), phone: String(b.phone ?? "").trim(),
  attendance: b.attendance === "" || b.attendance === undefined ? 0 : Number(b.attendance),
  marks: b.marks === "" || b.marks === undefined ? 0 : Number(b.marks)
});

app.use(cors());
app.use(express.json({ limit: "50kb" }));

app.get("/api/health", async (req, res) => res.json({ status: "ok", storage: col ? "mongodb" : "file", students: (await db.all()).length }));

app.get("/api/students", async (req, res) => {
  const { q = "", course = "" } = req.query;
  const students = await db.all();
  const t = q.toLowerCase();
  res.json(students.filter(s =>
    (!course || s.course === course) &&
    (!t || [s.name, s.roll, s.email].some(v => v.toLowerCase().includes(t)))));
});

app.get("/api/stats", async (req, res) => {
  const students = await db.all();
  const n = students.length || 1;
  const byCourse = {};
  students.forEach(s => { byCourse[s.course] = (byCourse[s.course] || 0) + 1; });
  res.json({
    total: students.length,
    avgAttendance: Math.round(students.reduce((a, s) => a + s.attendance, 0) / n),
    avgMarks: Math.round(students.reduce((a, s) => a + s.marks, 0) / n),
    lowAttendance: students.filter(s => s.attendance < 75).length,
    byCourse
  });
});

app.get("/api/students/:id", async (req, res) => {
  const s = await db.get(req.params.id);
  s ? res.json(s) : res.status(404).json({ error: "Student not found" });
});

app.post("/api/students", async (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const data = clean(req.body);
  if (await db.rollTaken(data.roll)) return res.status(409).json({ errors: ["roll number already exists"] });
  const s = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
  await db.add(s); res.status(201).json(s);
});

app.put("/api/students/:id", async (req, res) => {
  if (!(await db.get(req.params.id))) return res.status(404).json({ error: "Student not found" });
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const data = clean(req.body);
  if (await db.rollTaken(data.roll, req.params.id)) return res.status(409).json({ errors: ["roll number already exists"] });
  res.json(await db.update(req.params.id, data));
});

app.delete("/api/students/:id", async (req, res) => {
  if (!(await db.remove(req.params.id))) return res.status(404).json({ error: "Student not found" });
  res.status(204).end();
});

const dist = path.join(__dirname, "dist");
app.use(express.static(dist));
app.get("*", (req, res, next) => req.path.startsWith("/api") ? next() : res.sendFile(path.join(dist, "index.html")));
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

initStorage().then(() => app.listen(PORT, () => console.log(`Student Management System running on http://localhost:${PORT}`)));
