import express from "express";
import cors from "cors";
import compression from "compression";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { createStore } from "./server/store.js";
import { ensureSeed, seed, DEMO, todayIST } from "./server/seed.js";
import { COURSES, PAYMENT_MODES, GRADES, LOW_ATTENDANCE } from "./server/config.js";
import { buildContext, enrich, reportFor, feeFor, attendanceFor } from "./server/compute.js";
import { requireAuth, signToken, publicUser, canAccessStudent } from "./server/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const app = express();
let store;

const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const admin = requireAuth("admin");
const anyUser = requireAuth();

async function loadAll() {
  const [students, attendance, marks, payments] = await Promise.all(
    ["students", "attendance", "marks", "payments"].map(c => store.find(c)));
  return { students, attendance, marks, payments, ctx: buildContext({ attendance, marks, payments }) };
}

// ---------- Validation ----------
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[6-9]\d{9}$/;
function cleanStudent(b) {
  return {
    name: String(b.name ?? "").trim().replace(/\s+/g, " "),
    gender: ["M", "F", "O"].includes(b.gender) ? b.gender : "O",
    course: String(b.course ?? "").trim(),
    semester: Number(b.semester),
    roll: String(b.roll ?? "").trim().toUpperCase(),
    email: String(b.email ?? "").trim().toLowerCase(),
    phone: String(b.phone ?? "").replace(/\D/g, "").slice(-10),
    guardianName: String(b.guardianName ?? "").trim(),
    guardianPhone: String(b.guardianPhone ?? "").replace(/\D/g, "").slice(-10),
    dob: String(b.dob ?? "").trim(),
    address: String(b.address ?? "").trim().slice(0, 200)
  };
}
function validateStudent(s) {
  const e = [];
  if (s.name.length < 2 || s.name.length > 60) e.push("Name must be 2-60 characters");
  if (!COURSES[s.course]) e.push("Select a valid course");
  else if (!Number.isInteger(s.semester) || s.semester < 1 || s.semester > COURSES[s.course].semesters) e.push(`Semester must be 1-${COURSES[s.course].semesters}`);
  if (!EMAIL.test(s.email)) e.push("Enter a valid email");
  if (!PHONE.test(s.phone)) e.push("Phone must be a valid 10-digit Indian mobile number");
  if (s.guardianPhone && !PHONE.test(s.guardianPhone)) e.push("Guardian phone must be a valid 10-digit number");
  if (s.dob && !/^\d{4}-\d{2}-\d{2}$/.test(s.dob)) e.push("Date of birth is invalid");
  if (s.roll && !/^[A-Z0-9-]{4,15}$/.test(s.roll)) e.push("Roll number may only contain letters and digits");
  return e;
}
async function nextRoll(course, semester) {
  const year = 2026 - Math.floor((semester - 1) / 2);
  const prefix = `${COURSES[course].prefix}${String(year).slice(2)}`;
  const nums = (await store.find("students")).filter(s => s.roll.startsWith(prefix)).map(s => Number(s.roll.slice(prefix.length)) || 0);
  return `${prefix}${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
}

async function fullProfile(id) {
  const student = await store.findOne("students", { id });
  if (!student) return null;
  const [marksDoc, payments, sheets] = await Promise.all([
    store.findOne("marks", { studentId: id }), store.find("payments", { studentId: id }), store.find("attendance")]);
  const ctx = buildContext({ attendance: sheets, marks: marksDoc ? [marksDoc] : [], payments });
  const log = sheets.filter(d => d.records?.[id]).map(d => ({ date: d.date, status: d.records[id] })).sort((a, b) => b.date.localeCompare(a.date));
  return {
    student: enrich(student, ctx),
    attendance: { ...attendanceFor(id, ctx), log },
    report: reportFor(student, marksDoc),
    fee: feeFor(student, payments),
    payments: payments.sort((a, b) => b.date.localeCompare(a.date)),
    courseInfo: { name: student.course, ...COURSES[student.course] }
  };
}

// ---------- Middleware ----------
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "100kb" }));

// ---------- Public ----------
app.get("/api/health", ah(async (req, res) => res.json({ status: "ok", storage: store.kind, students: await store.count("students") })));
app.get("/api/meta", (req, res) => res.json({ courses: COURSES, paymentModes: PAYMENT_MODES, grades: GRADES, lowAttendance: LOW_ATTENDANCE, today: todayIST() }));

// ---------- Auth ----------
app.post("/api/auth/login", ah(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const user = await store.findOne("users", { email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password" });
  res.json({ token: signToken(user), user: publicUser(user) });
}));
app.get("/api/auth/me", anyUser, ah(async (req, res) => {
  const user = await store.findOne("users", { id: req.user.id });
  if (!user) return res.status(401).json({ error: "Account no longer exists. Please log in again." });
  res.json({ user: publicUser(user) });
}));

// ---------- Student self-service ----------
app.get("/api/me", anyUser, ah(async (req, res) => {
  if (req.user.role !== "student") return res.status(400).json({ error: "Only student accounts have a personal profile" });
  const p = await fullProfile(req.user.studentId);
  p ? res.json(p) : res.status(404).json({ error: "Student profile not found" });
}));

// ---------- Dashboard ----------
app.get("/api/stats", admin, ah(async (req, res) => {
  const { students, attendance, payments, ctx } = await loadAll();
  const list = students.map(s => enrich(s, ctx));
  const n = list.length || 1;
  const withAtt = list.filter(s => s.attendance.pct != null);
  const withMarks = list.filter(s => s.cgpa != null);
  const byCourse = Object.keys(COURSES).map(c => {
    const g = list.filter(s => s.course === c);
    return { course: c, students: g.length, collected: g.reduce((a, s) => a + s.fee.paid, 0), due: g.reduce((a, s) => a + s.fee.due, 0) };
  });
  const byDate = {};
  attendance.forEach(d => Object.values(d.records || {}).forEach(v => { const x = (byDate[d.date] ||= { p: 0, t: 0 }); x.t++; if (v === "P") x.p++; }));
  const attendanceTrend = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).slice(-30)
    .map(([date, x]) => ({ date, pct: Math.round((x.p / x.t) * 1000) / 10, present: x.p, total: x.t }));
  const gradeDistribution = GRADES.map(g => ({ grade: g.grade, count: list.filter(s => s.grade === g.grade).length })).reverse();
  const nameOf = Object.fromEntries(students.map(s => [s.id, s]));
  res.json({
    kpis: {
      students: list.length,
      courses: new Set(list.map(s => s.course)).size,
      avgAttendance: withAtt.length ? Math.round(withAtt.reduce((a, s) => a + s.attendance.pct, 0) / withAtt.length * 10) / 10 : 0,
      avgCgpa: withMarks.length ? Math.round(withMarks.reduce((a, s) => a + s.cgpa, 0) / withMarks.length * 100) / 100 : 0,
      feesCollected: list.reduce((a, s) => a + s.fee.paid, 0),
      feesDue: list.reduce((a, s) => a + s.fee.due, 0),
      lowAttendance: list.filter(s => s.attendance.low).length,
      passRate: withMarks.length ? Math.round(withMarks.filter(s => s.result === "Pass").length / withMarks.length * 100) : 0
    },
    byCourse, attendanceTrend, gradeDistribution,
    feeStatus: ["Paid", "Partial", "Due"].map(st => ({ status: st, count: list.filter(s => s.fee.status === st).length })),
    lowAttendance: list.filter(s => s.attendance.low).sort((a, b) => a.attendance.pct - b.attendance.pct)
      .map(s => ({ id: s.id, name: s.name, roll: s.roll, course: s.course, semester: s.semester, pct: s.attendance.pct })),
    topPerformers: withMarks.sort((a, b) => b.cgpa - a.cgpa).slice(0, 5)
      .map(s => ({ id: s.id, name: s.name, roll: s.roll, course: s.course, cgpa: s.cgpa, percentage: s.percentage })),
    recentPayments: payments.sort((a, b) => b.date.localeCompare(a.date) || b.receiptNo.localeCompare(a.receiptNo)).slice(0, 6)
      .map(p => ({ ...p, studentName: nameOf[p.studentId]?.name || "Deleted student", roll: nameOf[p.studentId]?.roll })),
    totalStudents: n === 0 ? 0 : list.length
  });
}));

// ---------- Students ----------
app.get("/api/students", admin, ah(async (req, res) => {
  const { q = "", course = "", semester = "", attendance = "", fee = "", sort = "roll", order = "asc" } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 10));
  const { students, ctx } = await loadAll();
  const t = String(q).toLowerCase().trim();
  let list = students.map(s => enrich(s, ctx)).filter(s =>
    (!course || s.course === course) && (!semester || s.semester === Number(semester)) &&
    (!attendance || (attendance === "low" ? s.attendance.low : !s.attendance.low)) &&
    (!fee || s.fee.status === fee) &&
    (!t || [s.name, s.roll, s.email, s.phone, s.guardianName].some(v => String(v || "").toLowerCase().includes(t))));
  const keys = { name: s => s.name, roll: s => s.roll, course: s => s.course, semester: s => s.semester, attendance: s => s.attendance.pct ?? -1, cgpa: s => s.cgpa ?? -1, fee: s => s.fee.due };
  const key = keys[sort] || keys.roll; const dir = order === "desc" ? -1 : 1;
  list.sort((a, b) => { const x = key(a), y = key(b); return (typeof x === "string" ? x.localeCompare(y) : x - y) * dir; });
  const total = list.length;
  res.json({ items: list.slice((page - 1) * limit, page * limit), total, page, pages: Math.max(1, Math.ceil(total / limit)), limit });
}));

app.get("/api/students/:id/profile", anyUser, ah(async (req, res) => {
  if (!canAccessStudent(req.user, req.params.id)) return res.status(403).json({ error: "You can only view your own profile" });
  const p = await fullProfile(req.params.id);
  p ? res.json(p) : res.status(404).json({ error: "Student not found" });
}));

app.post("/api/students", admin, ah(async (req, res) => {
  const s = cleanStudent(req.body || {});
  const errors = validateStudent(s);
  if (errors.length) return res.status(400).json({ errors });
  if (!s.roll) s.roll = await nextRoll(s.course, s.semester);
  if (await store.findOne("students", { roll: s.roll })) return res.status(409).json({ errors: ["Roll number already exists"] });
  if (await store.findOne("users", { email: s.email })) return res.status(409).json({ errors: ["Email is already registered"] });
  const student = { id: randomUUID(), ...s, admissionYear: 2026 - Math.floor((s.semester - 1) / 2), createdAt: new Date().toISOString() };
  await store.insertOne("students", student);
  await store.insertOne("users", { id: `usr_${student.id}`, email: s.email, name: s.name, role: "student", studentId: student.id, passwordHash: await bcrypt.hash(DEMO.studentPassword, 10), createdAt: student.createdAt });
  res.status(201).json(student);
}));

app.put("/api/students/:id", admin, ah(async (req, res) => {
  const existing = await store.findOne("students", { id: req.params.id });
  if (!existing) return res.status(404).json({ error: "Student not found" });
  const s = cleanStudent({ ...existing, ...req.body });
  const errors = validateStudent(s);
  if (errors.length) return res.status(400).json({ errors });
  if (!s.roll) s.roll = existing.roll;
  const rollOwner = await store.findOne("students", { roll: s.roll });
  if (rollOwner && rollOwner.id !== existing.id) return res.status(409).json({ errors: ["Roll number already exists"] });
  const emailOwner = await store.findOne("users", { email: s.email });
  if (emailOwner && emailOwner.studentId !== existing.id) return res.status(409).json({ errors: ["Email is already registered"] });
  await store.updateOne("students", { id: existing.id }, s);
  await store.updateOne("users", { studentId: existing.id }, { email: s.email, name: s.name });
  res.json({ ...existing, ...s });
}));

app.delete("/api/students/:id", admin, ah(async (req, res) => {
  const s = await store.findOne("students", { id: req.params.id });
  if (!s) return res.status(404).json({ error: "Student not found" });
  await store.deleteOne("students", { id: s.id });
  await Promise.all([store.deleteMany("users", { studentId: s.id }), store.deleteMany("marks", { studentId: s.id }), store.deleteMany("payments", { studentId: s.id })]);
  for (const d of await store.find("attendance")) {
    if (d.records && s.id in d.records) { const { [s.id]: _, ...rest } = d.records; await store.upsert("attendance", { id: d.id }, { ...d, records: rest }); }
  }
  res.status(204).end();
}));

// ---------- Attendance ----------
const groupOf = q => ({ course: String(q.course || ""), semester: Number(q.semester) });
app.get("/api/attendance/sheet", admin, ah(async (req, res) => {
  const { course, semester } = groupOf(req.query);
  const date = String(req.query.date || todayIST());
  if (!COURSES[course] || !semester) return res.status(400).json({ error: "course and semester are required" });
  const [students, sheets] = await Promise.all([store.find("students", { course, semester }), store.find("attendance")]);
  const ctx = buildContext({ attendance: sheets });
  const sheet = sheets.find(d => d.course === course && d.semester === semester && d.date === date);
  const history = sheets.filter(d => d.course === course && d.semester === semester).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
    .map(d => { const v = Object.values(d.records || {}); return { date: d.date, present: v.filter(x => x === "P").length, total: v.length }; });
  res.json({
    course, semester, date, marked: !!sheet, history,
    students: students.sort((a, b) => a.roll.localeCompare(b.roll)).map(s => ({
      id: s.id, name: s.name, roll: s.roll, status: sheet?.records?.[s.id] || null, attendance: attendanceFor(s.id, ctx)
    }))
  });
}));

app.post("/api/attendance", admin, ah(async (req, res) => {
  const { course, semester } = groupOf(req.body || {});
  const date = String(req.body?.date || "");
  const records = req.body?.records || {};
  if (!COURSES[course] || !semester) return res.status(400).json({ error: "course and semester are required" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "A valid date is required" });
  if (date > todayIST()) return res.status(400).json({ error: "Attendance cannot be marked for a future date" });
  const group = await store.find("students", { course, semester });
  if (!group.length) return res.status(400).json({ error: "No students in this course and semester" });
  const clean = {};
  for (const s of group) {
    const v = records[s.id];
    if (v !== "P" && v !== "A") return res.status(400).json({ error: `Mark Present or Absent for ${s.name}` });
    clean[s.id] = v;
  }
  const id = `att_${course}_${semester}_${date}`.replace(/[^\w-]/g, "");
  await store.upsert("attendance", { id }, { id, course, semester, date, records: clean, markedBy: req.user.email, updatedAt: new Date().toISOString() });
  const v = Object.values(clean);
  res.json({ ok: true, date, present: v.filter(x => x === "P").length, absent: v.filter(x => x === "A").length });
}));

app.get("/api/attendance/low", admin, ah(async (req, res) => {
  const { students, ctx } = await loadAll();
  res.json(students.map(s => ({ id: s.id, name: s.name, roll: s.roll, course: s.course, semester: s.semester, phone: s.phone, attendance: attendanceFor(s.id, ctx) }))
    .filter(s => s.attendance.low).sort((a, b) => a.attendance.pct - b.attendance.pct));
}));

// ---------- Marks ----------
app.get("/api/marks", admin, ah(async (req, res) => {
  const { course = "", semester = "" } = req.query;
  const [students, marks] = await Promise.all([store.find("students"), store.find("marks")]);
  const by = Object.fromEntries(marks.map(m => [m.studentId, m]));
  res.json(students.filter(s => (!course || s.course === course) && (!semester || s.semester === Number(semester)))
    .sort((a, b) => a.roll.localeCompare(b.roll))
    .map(s => ({ id: s.id, name: s.name, roll: s.roll, course: s.course, semester: s.semester, report: reportFor(s, by[s.id]) })));
}));

app.put("/api/marks/:studentId", admin, ah(async (req, res) => {
  const s = await store.findOne("students", { id: req.params.studentId });
  if (!s) return res.status(404).json({ error: "Student not found" });
  const input = Array.isArray(req.body?.subjects) ? req.body.subjects : [];
  const subjects = [];
  for (const sub of COURSES[s.course].subjects) {
    const m = input.find(x => x.code === sub.code);
    if (!m || m.internal === "" || m.external === "" || m.internal == null || m.external == null) continue;
    const internal = Number(m.internal), external = Number(m.external);
    if (!Number.isFinite(internal) || internal < 0 || internal > 30) return res.status(400).json({ error: `${sub.name}: internal marks must be 0-30` });
    if (!Number.isFinite(external) || external < 0 || external > 70) return res.status(400).json({ error: `${sub.name}: external marks must be 0-70` });
    subjects.push({ code: sub.code, internal, external });
  }
  await store.upsert("marks", { studentId: s.id }, { studentId: s.id, subjects, updatedAt: new Date().toISOString() });
  res.json(reportFor(s, { subjects }));
}));

// ---------- Fees ----------
app.get("/api/fees", admin, ah(async (req, res) => {
  const { students, payments, ctx } = await loadAll();
  const list = students.map(s => ({ id: s.id, name: s.name, roll: s.roll, course: s.course, semester: s.semester, phone: s.phone, fee: feeFor(s, ctx.payBy[s.id]) }))
    .sort((a, b) => a.roll.localeCompare(b.roll));
  const nameOf = Object.fromEntries(students.map(s => [s.id, s]));
  res.json({
    summary: {
      expected: list.reduce((a, s) => a + s.fee.total, 0), collected: list.reduce((a, s) => a + s.fee.paid, 0), due: list.reduce((a, s) => a + s.fee.due, 0),
      paid: list.filter(s => s.fee.status === "Paid").length, partial: list.filter(s => s.fee.status === "Partial").length, unpaid: list.filter(s => s.fee.status === "Due").length
    },
    students: list,
    payments: payments.sort((a, b) => b.date.localeCompare(a.date) || b.receiptNo.localeCompare(a.receiptNo))
      .map(p => ({ ...p, studentName: nameOf[p.studentId]?.name || "Deleted student", roll: nameOf[p.studentId]?.roll || "-" }))
  });
}));

app.post("/api/fees/payments", admin, ah(async (req, res) => {
  const b = req.body || {};
  const s = await store.findOne("students", { id: String(b.studentId || "") });
  if (!s) return res.status(404).json({ error: "Select a valid student" });
  const amount = Math.round(Number(b.amount));
  const mode = String(b.mode || "");
  const date = String(b.date || todayIST());
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Amount must be greater than zero" });
  if (!PAYMENT_MODES.includes(mode)) return res.status(400).json({ error: `Mode must be one of ${PAYMENT_MODES.join(", ")}` });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayIST()) return res.status(400).json({ error: "Enter a valid payment date (not in the future)" });
  const fee = feeFor(s, await store.find("payments", { studentId: s.id }));
  if (fee.due === 0) return res.status(400).json({ error: "Fees are already fully paid" });
  if (amount > fee.due) return res.status(400).json({ error: `Amount exceeds the pending due of Rs ${fee.due}` });
  const count = await store.count("payments");
  const all = await store.find("payments");
  const maxNo = Math.max(count, ...all.map(p => Number(String(p.receiptNo || "").split("-").pop()) || 0));
  const payment = {
    id: randomUUID(), receiptNo: `RCPT-2026-${String(maxNo + 1).padStart(4, "0")}`, studentId: s.id, amount, mode, date,
    reference: String(b.reference || (mode === "Cash" ? "Cash counter" : "")).trim().slice(0, 40), createdAt: new Date().toISOString()
  };
  await store.insertOne("payments", payment);
  res.status(201).json({ payment, fee: feeFor(s, [...(await store.find("payments", { studentId: s.id }))]) });
}));

// ---------- Demo reset ----------
app.post("/api/admin/reset-demo", admin, ah(async (req, res) => { await seed(store); res.json({ ok: true }); }));

// ---------- Frontend ----------
const dist = path.join(__dirname, "dist");
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));
app.use(express.static(dist, { maxAge: "7d", index: false, setHeaders: (res, p) => { if (p.endsWith(".html")) res.setHeader("Cache-Control", "no-cache"); } }));
app.get("*", (req, res) => { res.setHeader("Cache-Control", "no-cache"); res.sendFile(path.join(dist, "index.html")); });
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: "Something went wrong on the server" }); });

createStore({ uri: process.env.MONGODB_URI, file: path.join(__dirname, "data", "db.json") })
  .then(async s => { store = s; await ensureSeed(store); app.listen(PORT, () => console.log(`Student Management System running on http://localhost:${PORT}`)); })
  .catch(e => { console.error("Startup failed:", e); process.exit(1); });
