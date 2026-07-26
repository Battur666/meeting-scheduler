import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export function signToken(payload, expiresIn = "12h") {
  return jwt.sign(payload, SECRET, { expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function requireRole(role) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = token && verifyToken(token);

    if (!payload || payload.role !== role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (role === "employee") req.employee = payload.employee;
    if (role === "admin") req.admin = true;
    next();
  };
}

export const requireEmployee = requireRole("employee");
export const requireAdmin = requireRole("admin");
