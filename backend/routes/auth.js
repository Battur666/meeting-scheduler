import { Router } from "express";
import Employee from "../models/Employee.js";
import { signToken } from "../lib/auth.js";

const router = Router();

async function fetchTokiUser(token) {
  const res = await fetch(`${process.env.TOKI_BASE_URL}/third-party-service/v1/shoppy/user`, {
    headers: {
      accept: "application/json",
      "api-key": process.env.TOKI_API_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body?.data ?? null;
}

// POST /api/auth/toki — exchange a Toki mini-program token (or, outside
// production, a raw devPhone) for an app session tied to a known employee.
router.post("/toki", async (req, res) => {
  const { token, devPhone } = req.body;

  let phoneNo;
  if (devPhone && process.env.NODE_ENV !== "production") {
    phoneNo = devPhone;
  } else {
    if (!token) return res.status(400).json({ error: "token is required" });
    const tokiUser = await fetchTokiUser(token);
    if (!tokiUser) return res.status(502).json({ authorized: false, reason: "toki_lookup_failed" });
    phoneNo = tokiUser.phoneNo;
  }

  const employee = await Employee.findOne({ phone: phoneNo });

  if (!employee) {
    return res.status(403).json({ authorized: false, reason: "not_employee" });
  }

  const sessionToken = signToken({ role: "employee", employee }, "12h");
  res.json({ authorized: true, sessionToken, employee });
});

export default router;
