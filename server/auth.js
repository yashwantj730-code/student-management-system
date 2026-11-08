import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

let SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  SECRET = randomBytes(32).toString("hex");
  console.warn("WARNING: JWT_SECRET is not set. Using a random secret for this run; sessions will reset on restart.");
}

export const publicUser = u => ({ id: u.id, email: u.email, name: u.name, role: u.role, studentId: u.studentId || null });
export const signToken = u => jwt.sign(publicUser(u), SECRET, { expiresIn: "7d" });

// requireAuth() = any logged-in user; requireAuth("admin") = admins only
export const requireAuth = (...roles) => (req, res, next) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in to continue" });
  try { req.user = jwt.verify(token, SECRET); }
  catch { return res.status(401).json({ error: "Your session has expired. Please log in again." }); }
  if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: "You do not have permission to access this resource" });
  next();
};

// Admins can access any student; students only themselves
export const canAccessStudent = (user, studentId) => user.role === "admin" || user.studentId === studentId;
