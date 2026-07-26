import { Router } from "express";
import Attendee from "../models/Attendee.js";

const router = Router();

// GET /api/attendees  — list all people who can be invited
router.get("/", async (req, res) => {
  res.json(await Attendee.find());
});

export default router;
