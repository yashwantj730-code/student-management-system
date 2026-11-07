import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

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

function load() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2)); return [...SEED]; }
}
let students = load();
const save = () => fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));

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

app.get("/api/health", (req, res) => res.json({ status: "ok", students: students.length }));

app.get("/api/students", (req, res) => {
  const { q = "", course = "" } = req.query;
  const t = q.toLowerCase();
  res.json(students.filter(s =>
    (!course || s.course === course) &&
    (!t || [s.name, s.roll, s.email].some(v => v.toLowerCase().includes(t)))));
});

app.get("/api/stats", (req, res) => {
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

app.get("/api/students/:id", (req, res) => {
  const s = students.find(x => x.id === req.params.id);
  s ? res.json(s) : res.status(404).json({ error: "Student not found" });
});

app.post("/api/students", (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const data = clean(req.body);
  if (students.some(s => s.roll === data.roll)) return res.status(409).json({ errors: ["roll number already exists"] });
  const s = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
  students.unshift(s); save(); res.status(201).json(s);
});

app.put("/api/students/:id", (req, res) => {
  const i = students.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "Student not found" });
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const data = clean(req.body);
  if (students.some(s => s.roll === data.roll && s.id !== req.params.id)) return res.status(409).json({ errors: ["roll number already exists"] });
  students[i] = { ...students[i], ...data }; save(); res.json(students[i]);
});

app.delete("/api/students/:id", (req, res) => {
  const before = students.length;
  students = students.filter(x => x.id !== req.params.id);
  if (students.length === before) return res.status(404).json({ error: "Student not found" });
  save(); res.status(204).end();
});

const dist = path.join(__dirname, "dist");
app.use(express.static(dist));
app.get("*", (req, res, next) => req.path.startsWith("/api") ? next() : res.sendFile(path.join(dist, "index.html")));
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => console.log(`Student Management System running on http://localhost:${PORT}`));
