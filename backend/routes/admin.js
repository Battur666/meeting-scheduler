import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import Employee from "../models/Employee.js";
import Attendee from "../models/Attendee.js";
import { signToken, requireAdmin } from "../lib/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function initialsOf(firstname, lastname) {
  return `${firstname?.[0] ?? ""}${lastname?.[0] ?? ""}`.toUpperCase();
}

// POST /api/admin/login
router.post("/login", (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }
  const sessionToken = signToken({ role: "admin" }, "12h");
  res.json({ sessionToken });
});

// POST /api/admin/employees/upload — replace the employee roster from an xlsx file
router.post("/employees/upload", requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file is required" });

  const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const employees = rows
    .map((row) => ({
      lastname: String(row.lastname ?? "").trim(),
      firstname: String(row.firstname ?? "").trim(),
      phone: String(row.employeephone ?? "").trim(),
      department: String(row.departmentname ?? "").trim(),
      company: String(row.companyname ?? "").trim(),
    }))
    .filter((e) => e.phone);

  const seen = new Set();
  const deduped = [];
  for (const e of employees) {
    if (seen.has(e.phone)) continue;
    seen.add(e.phone);
    deduped.push({ id: `emp_${e.phone}`, ...e });
  }

  const attendees = deduped.map((e) => ({
    id: `att_${e.phone}`,
    name: `${e.lastname} ${e.firstname}`.trim(),
    role: e.department,
    initials: initialsOf(e.firstname, e.lastname),
  }));

  await Employee.deleteMany({});
  await Employee.insertMany(deduped);
  await Attendee.deleteMany({});
  await Attendee.insertMany(attendees);

  res.json({ count: deduped.length });
});

// GET /api/admin/employees — current roster
router.get("/employees", requireAdmin, async (req, res) => {
  res.json(await Employee.find());
});

export default router;
