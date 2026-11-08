# EduTrack · Student Management System

A full stack, role-based **Student Management System** built by **[Yashwant Jaiswal](https://yashwantj730-code.github.io/yashwant-portfolio/)** (BCA, Integral University, Lucknow).

**Live demo:** https://student-management-system-l5ek.onrender.com
*(Free hosting: the first load after a period of inactivity can take up to a minute while the server wakes up.)*

## Demo credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | `admin@sms.demo` | `Admin@123` | Everything: students, attendance, marks, fees, dashboard |
| Student | `aarav.sharma@example.com` | `Student@123` | Only their own profile, attendance, report card and fees |

Every seeded student can log in with their email and `Student@123`. The login page has one-click demo buttons. Admins can restore the original data any time with **Reset demo data** in the sidebar.

## Features

**Authentication & roles**
- JWT login with bcrypt-hashed passwords, 7-day sessions, logout
- Two roles: **Admin** (full access) and **Student** (self-service portal)
- Protected API routes with role checks (a student calling an admin route gets `403`)

**Dashboard**
- KPI cards with animated counters: students, average attendance, average CGPA, fees collected
- Recharts: attendance trend (30 working days), students by course, result (grade) distribution, fees collected vs due (donut + per course)
- Low-attendance alerts, top performers, recent payments

**Students**
- Search (name, roll no, email, phone, guardian), filters (course, semester, attendance status, fee status)
- Sortable columns, server-side pagination, CSV export
- Add / edit / delete via animated modals with validation (Indian mobile numbers, unique roll no & email)
- Auto-generated roll numbers (e.g. `BCA25009`) and an automatic student login for every new student
- Detailed profile page with tabs: overview, attendance, marks, fees

**Attendance**
- Date-wise Present / Absent marking per course + semester, with "all present / all absent" shortcuts
- Edit previously marked days, recent-days history, future dates blocked
- Attendance % per student, day-wise record, and a **below 75%** warning list (with days needed to recover)

**Marks & report cards**
- Subject-wise marks (internal /30 + external /70) for 4-5 real subjects per course
- Automatic grades (O, A+, A, B+, B, C, F), credit-weighted CGPA, percentage and Pass/Fail result
- Live grade preview while editing, result sheet CSV export
- **Printable report card** (print-friendly CSS, `window.print()` / Save as PDF)

**Fees**
- Semester fee per course, payments with date, mode (UPI / Cash / Card), reference and auto receipt number
- Paid / Partial / Unpaid badges, progress bars, overpayment protection, payment history and CSV export

**UI / UX**
- React Router pages with code splitting, Framer Motion page / card / modal animations
- Sidebar layout with Lucide icons, collapsible mobile drawer, fully responsive
- Dark / light mode, glassmorphism and gradient accents, skeleton loaders, toast notifications
- "Waking up the server" banner when the free Render instance is cold-starting

**Realistic demo data**
- 30 students with Indian names, roll numbers like `BCA25001`, courses BCA, B.Tech CSE, B.Sc IT, MCA and BBA
- Lucknow addresses, +91 phone numbers, guardian names, attendance for the last 30 working days, marks and fee payments
- Versioned seed (`meta.seedVersion = 2`): the database is reseeded automatically when the seed version changes

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Framer Motion, Recharts, Lucide React, React Hot Toast
- **Backend:** Node.js, Express, JWT (`jsonwebtoken`), `bcryptjs`, compression
- **Database:** MongoDB Atlas (official `mongodb` driver), with a local JSON-file fallback for development
- **Hosting:** Render (single web service serving the API and the built frontend)

## API overview

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Logged in |
| GET | `/api/health`, `/api/meta` | Public |
| GET | `/api/me` | Student (own full profile) |
| GET | `/api/stats` | Admin |
| GET / POST | `/api/students` | Admin (list supports `q, course, semester, attendance, fee, sort, order, page, limit`) |
| PUT / DELETE | `/api/students/:id` | Admin |
| GET | `/api/students/:id/profile` | Admin or that student |
| GET | `/api/attendance/sheet?course&semester&date` | Admin |
| POST | `/api/attendance` | Admin |
| GET | `/api/attendance/low` | Admin |
| GET · PUT | `/api/marks?course&semester` · `/api/marks/:studentId` | Admin |
| GET · POST | `/api/fees` · `/api/fees/payments` | Admin |
| POST | `/api/admin/reset-demo` | Admin |

## Run locally

```bash
npm install
npm run build
npm start              # http://localhost:5000 (uses data/db.json when MONGODB_URI is not set)
```

For development with hot reload run `npm run dev:server` and `npm run dev` in two terminals (Vite proxies `/api` to port 5000).

### Environment variables

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string (optional; falls back to a local JSON file) |
| `JWT_SECRET` | Secret used to sign login tokens. If unset, a random one is generated at startup (sessions reset on restart) |
| `PORT` | Server port (default 5000) |

## Project structure

```
server.js            Express app and REST API
server/
  auth.js            JWT sign / verify, role middleware
  compute.js         Attendance %, grades, CGPA, fee status
  config.js          Courses, subjects, fees, grade scale
  seed.js            Versioned, deterministic demo data
  store.js           MongoDB / JSON-file storage layer
src/
  App.jsx            Routes and route guards
  lib/               API client, auth, theme, hooks, helpers
  components/        Layout, modals, profile panels, report card, UI kit
  pages/             Login, Dashboard, Students, StudentDetail, Attendance, Marks, Fees, MyPortal, ReportCard
```

## Deploy (Render)

Web Service · Build: `npm install && npm run build` · Start: `npm start` · Env: `MONGODB_URI`, `JWT_SECRET`

---
Made by Yashwant Jaiswal · [GitHub](https://github.com/yashwantj730-code) · [Portfolio](https://yashwantj730-code.github.io/yashwant-portfolio/)
