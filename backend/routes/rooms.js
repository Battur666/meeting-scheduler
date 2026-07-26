import { Router } from "express";
import Room from "../models/Room.js";

const router = Router();

// GET /api/rooms — list all bookable rooms
router.get("/", async (req, res) => {
  res.json(await Room.find());
});

export default router;
