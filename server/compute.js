import { COURSES, gradeOf, LOW_ATTENDANCE } from "./config.js";

const round1 = n => Math.round(n * 10) / 10;

export function buildContext({ attendance = [], marks = [], payments = [] }) {
  const att = {};
  for (const d of attendance) {
    for (const [sid, st] of Object.entries(d.records || {})) {
      const a = (att[sid] ||= { present: 0, total: 0 });
      a.total++; if (st === "P") a.present++;
    }
  }
  const marksBy = Object.fromEntries(marks.map(m => [m.studentId, m]));
  const payBy = {};
  payments.forEach(p => (payBy[p.studentId] ||= []).push(p));
  return { att, marksBy, payBy };
}

export function reportFor(student, marksDoc) {
  const course = COURSES[student.course];
  const subjects = (course?.subjects || []).map(sub => {
    const m = marksDoc?.subjects?.find(x => x.code === sub.code) || {};
    const internal = m.internal ?? null, external = m.external ?? null;
    const total = internal == null || external == null ? null : internal + external;
    const g = total == null ? null : gradeOf(total);
    return { ...sub, internal, external, total, max: 100, grade: g ? g.grade : "-", point: g ? g.point : 0 };
  });
  const graded = subjects.filter(s => s.total != null);
  const credits = graded.reduce((a, s) => a + s.credits, 0);
  const cgpa = credits ? Math.round((graded.reduce((a, s) => a + s.point * s.credits, 0) / credits) * 100) / 100 : null;
  const percentage = graded.length ? round1(graded.reduce((a, s) => a + s.total, 0) / graded.length) : null;
  const result = !graded.length ? "Pending" : graded.some(s => s.grade === "F") ? "Fail" : graded.length < subjects.length ? "Incomplete" : "Pass";
  return {
    subjects, cgpa, percentage, result,
    grade: percentage == null ? "-" : gradeOf(percentage).grade,
    totalObtained: graded.reduce((a, s) => a + s.total, 0), totalMax: subjects.length * 100,
    credits: subjects.reduce((a, s) => a + s.credits, 0)
  };
}

export function feeFor(student, pays = []) {
  const total = COURSES[student.course]?.semFee ?? 0;
  const paid = pays.reduce((a, p) => a + p.amount, 0);
  const due = Math.max(0, total - paid);
  return { total, paid, due, status: due === 0 ? "Paid" : paid > 0 ? "Partial" : "Due" };
}

export function attendanceFor(studentId, ctx) {
  const a = ctx.att[studentId] || { present: 0, total: 0 };
  const pct = a.total ? round1((a.present / a.total) * 100) : null;
  return { present: a.present, total: a.total, absent: a.total - a.present, pct, low: pct != null && pct < LOW_ATTENDANCE };
}

export function enrich(s, ctx) {
  const r = reportFor(s, ctx.marksBy[s.id]);
  return {
    ...s,
    attendance: attendanceFor(s.id, ctx),
    cgpa: r.cgpa, percentage: r.percentage, grade: r.grade, result: r.result,
    fee: feeFor(s, ctx.payBy[s.id])
  };
}
