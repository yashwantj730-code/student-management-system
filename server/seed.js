// Realistic, deterministic demo data (30 students). Bump SEED_VERSION to force a reseed.
import bcrypt from "bcryptjs";
import { COURSES, PAYMENT_MODES } from "./config.js";
import { COLLECTIONS } from "./store.js";

export const SEED_VERSION = 2;
export const DEMO = { admin: { email: "admin@sms.demo", password: "Admin@123" }, studentPassword: "Student@123" };

function rng(seed) { // mulberry32
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// name, gender, guardian
const PEOPLE = [
  ["Aarav Sharma", "M", "Rajesh Sharma"], ["Priya Verma", "F", "Sunil Verma"], ["Mohd. Faizan Ahmad", "M", "Mohd. Iqbal Ahmad"],
  ["Harleen Kaur", "F", "Paramjit Singh"], ["Rohan Gupta", "M", "Alok Gupta"], ["Sana Khan", "F", "Imran Khan"],
  ["Daniel Joseph", "M", "George Joseph"], ["Ananya Mishra", "F", "Vivek Mishra"],
  ["Aditya Srivastava", "M", "Manoj Srivastava"], ["Zoya Rizvi", "F", "Syed Haider Rizvi"], ["Gurpreet Singh Bedi", "M", "Manjeet Singh Bedi"],
  ["Kavya Tiwari", "F", "Ashok Tiwari"],
  ["Vikas Yadav", "M", "Ramesh Yadav"], ["Ayaan Siddiqui", "M", "Tariq Siddiqui"], ["Sneha Thomas", "F", "Joseph Thomas"],
  ["Harsh Pandey", "M", "Dinesh Pandey"], ["Shreya Agarwal", "F", "Pankaj Agarwal"], ["Jaspreet Singh", "M", "Kulwant Singh"],
  ["Neha Singh", "F", "Arvind Singh"], ["Arham Qureshi", "M", "Naseem Qureshi"], ["Ritik Maurya", "M", "Santosh Maurya"], ["Ruth Masih", "F", "Samuel Masih"],
  ["Ankit Dubey", "M", "Rakesh Dubey"], ["Mehwish Ansari", "F", "Javed Ansari"], ["Kevin D'Souza", "M", "Anthony D'Souza"], ["Sakshi Rastogi", "F", "Nitin Rastogi"],
  ["Kunal Saxena", "M", "Sanjay Saxena"], ["Simran Kaur Gill", "F", "Harbhajan Singh Gill"], ["Sameer Usmani", "M", "Anwar Usmani"], ["Pooja Chaurasia", "F", "Mahesh Chaurasia"]
];
const GROUPS = [["BCA", 3, 8], ["BCA", 5, 4], ["B.Tech CSE", 5, 6], ["B.Sc IT", 3, 4], ["MCA", 1, 4], ["BBA", 3, 4]];
const AREAS = [
  ["Gomti Nagar", "226010"], ["Aliganj", "226024"], ["Indira Nagar", "226016"], ["Hazratganj", "226001"], ["Aminabad", "226018"],
  ["Chowk", "226003"], ["Alambagh", "226005"], ["Mahanagar", "226006"], ["Jankipuram", "226021"], ["Vikas Nagar", "226022"],
  ["Rajajipuram", "226017"], ["Ashiyana", "226012"], ["Telibagh", "226029"], ["Kursi Road", "226026"], ["Chinhat", "226028"],
  ["Nirala Nagar", "226020"], ["Aishbagh", "226004"], ["Thakurganj", "226003"], ["Kapoorthala", "226024"], ["Lalbagh", "226001"]
];
const LOW = { 4: 0.62, 13: 0.7, 18: 0.57, 20: 0.67, 26: 0.64 }; // students kept below 75% attendance

const pad = (n, w = 2) => String(n).padStart(w, "0");
const ymd = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export const todayIST = () => ymd(new Date(Date.now() + 5.5 * 3600 * 1000));

function workingDays(count) { // Mon-Fri, ending today (IST)
  const days = []; const d = new Date(todayIST() + "T00:00:00Z");
  while (days.length < count) { const w = d.getUTCDay(); if (w !== 0 && w !== 6) days.unshift(ymd(d)); d.setUTCDate(d.getUTCDate() - 1); }
  return days;
}
const emailOf = name => { const p = name.replace("Mohd. ", "").toLowerCase().replace(/[^a-z ]/g, "").split(" "); return `${p[0]}.${p[p.length - 1]}@example.com`; };

export function generate() {
  const r = rng(20261108);
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const phone = () => `${pick(["9", "8", "7", "6"])}${String(int(100000000, 999999999))}`;
  const days = workingDays(30);
  const now = new Date().toISOString();

  const students = []; let idx = 0;
  for (const [course, semester, n] of GROUPS) {
    const year = 2026 - Math.floor((semester - 1) / 2);
    for (let k = 1; k <= n; k++, idx++) {
      const [name, gender, guardianName] = PEOPLE[idx];
      const [area, pin] = AREAS[idx % AREAS.length];
      const age = 17 + Math.ceil(semester / 2) + (course === "MCA" ? 3 : 0);
      students.push({
        id: `stu_${pad(idx + 1, 3)}`, name, gender, course, semester, admissionYear: year,
        roll: `${COURSES[course].prefix}${String(year).slice(2)}${pad(k, 3)}`,
        email: emailOf(name), phone: phone(), guardianName, guardianPhone: phone(),
        dob: `${2026 - age}-${pad(int(1, 12))}-${pad(int(1, 28))}`,
        address: `${pick(["House No.", "Flat", "Plot"])} ${int(12, 640)}${pick(["", "-A", "-B", ", Sector " + int(2, 14)])}, ${area}, Lucknow, Uttar Pradesh ${pin}`,
        createdAt: now
      });
    }
  }

  // Attendance: one sheet per course+semester per working day, exact present count per student
  const attendance = [];
  const plan = {};
  students.forEach((s, i) => {
    const rate = LOW[i] ?? 0.78 + r() * 0.2;
    const presentCount = Math.round(rate * days.length);
    const order = days.map(d => [d, r()]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
    plan[s.id] = new Set(order.slice(0, days.length - presentCount)); // absent days
  });
  for (const [course, semester] of GROUPS) {
    const group = students.filter(s => s.course === course && s.semester === semester);
    for (const date of days) {
      attendance.push({
        id: `att_${course}_${semester}_${date}`.replace(/[^\w-]/g, ""), course, semester, date,
        records: Object.fromEntries(group.map(s => [s.id, plan[s.id].has(date) ? "A" : "P"])),
        markedBy: "admin", updatedAt: now
      });
    }
  }

  // Marks: ability correlated with attendance
  const marks = students.map((s, i) => {
    let ability = 0.5 + r() * 0.45; if (LOW[i]) ability -= 0.18;
    const subjects = COURSES[s.course].subjects.map(sub => {
      const score = Math.max(22, Math.min(98, Math.round(ability * 100 + (r() - 0.5) * 24)));
      const internal = Math.max(8, Math.min(30, Math.round(score * 0.3 + (r() - 0.4) * 4)));
      const external = Math.max(10, Math.min(70, score - internal));
      return { code: sub.code, internal, external };
    });
    return { studentId: s.id, subjects, updatedAt: now };
  });

  // Fees: ~55% fully paid, ~30% partial, ~15% nothing paid yet
  const payments = []; let receipt = 1;
  const dayAgo = n => { const d = new Date(todayIST() + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - n); return ymd(d); };
  const pay = (s, amount, ago) => {
    const mode = pick(PAYMENT_MODES);
    payments.push({
      id: `pay_${pad(receipt, 4)}`, receiptNo: `RCPT-2026-${pad(receipt++, 4)}`, studentId: s.id, amount, mode, date: dayAgo(ago),
      reference: mode === "UPI" ? `UPI${int(100000000, 999999999)}${int(100, 999)}` : mode === "Card" ? `XXXX-${int(1000, 9999)}` : "Cash counter",
      createdAt: now
    });
  };
  students.forEach((s, i) => {
    const total = COURSES[s.course].semFee; const x = r();
    if (i === 0 || x < 0.55) { if (r() < 0.5) pay(s, total, int(60, 105)); else { const first = Math.round(total * 0.5 / 1000) * 1000; pay(s, first, int(80, 105)); pay(s, total - first, int(10, 50)); } }
    else if (x < 0.85) pay(s, Math.round(total * (0.3 + r() * 0.4) / 1000) * 1000, int(20, 95));
  });
  payments.sort((a, b) => a.date.localeCompare(b.date));
  payments.forEach((p, i) => { p.receiptNo = `RCPT-2026-${pad(i + 1, 4)}`; p.id = `pay_${pad(i + 1, 4)}`; });

  return { students, attendance, marks, payments };
}

export async function seed(store) {
  for (const c of COLLECTIONS) await store.deleteMany(c, {});
  const { students, attendance, marks, payments } = generate();
  const [adminHash, studentHash] = await Promise.all([bcrypt.hash(DEMO.admin.password, 10), bcrypt.hash(DEMO.studentPassword, 10)]);
  const now = new Date().toISOString();
  const users = [
    { id: "usr_admin", email: DEMO.admin.email, name: "Admin (Demo)", role: "admin", passwordHash: adminHash, studentId: null, createdAt: now },
    ...students.map(s => ({ id: `usr_${s.id}`, email: s.email, name: s.name, role: "student", passwordHash: studentHash, studentId: s.id, createdAt: now }))
  ];
  await store.insertMany("students", students);
  await store.insertMany("users", users);
  await store.insertMany("attendance", attendance);
  await store.insertMany("marks", marks);
  await store.insertMany("payments", payments);
  await store.upsert("meta", { key: "seed" }, { key: "seed", seedVersion: SEED_VERSION, seededAt: now });
  console.log(`Seeded v${SEED_VERSION}: ${students.length} students, ${attendance.length} attendance sheets, ${payments.length} payments`);
}

export async function ensureSeed(store) {
  const meta = await store.findOne("meta", { key: "seed" });
  if (!meta || (meta.seedVersion || 0) < SEED_VERSION) await seed(store);
}
