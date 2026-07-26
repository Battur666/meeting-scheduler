import { Router } from "express";
import { nanoid } from "nanoid";
import Meeting from "../models/Meeting.js";
import BusyBlock from "../models/BusyBlock.js";

const router = Router();

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function isWeekday(dateStr) {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day >= 1 && day <= 5;
}

// GET /api/meetings — list all booked meetings
router.get("/", async (req, res) => {
  res.json(await Meeting.find());
});

// POST /api/meetings — book a meeting (room + attendees, no call link)
router.post("/", async (req, res) => {
  const { title, date, start, end, attendeeIds = [], roomId, agenda } = req.body;

  if (!title || !date || !start || !end) {
    return res.status(400).json({ error: "title, date, start, and end are required" });
  }

  if (!isWeekday(date)) {
    return res.status(400).json({ error: "Meetings can only be booked Monday–Friday." });
  }
  if (toMinutes(start) < toMinutes("07:00") || toMinutes(end) > toMinutes("19:00")) {
    return res.status(400).json({ error: "Meetings must be between 07:00 and 19:00." });
  }

  // Conflict check against existing busy blocks for attendees + room
  const relevantOwnerIds = [...attendeeIds, roomId].filter(Boolean);
  const clash = await BusyBlock.findOne({
    ownerId: { $in: relevantOwnerIds },
    date,
    start: { $lt: end },
    end: { $gt: start },
  });

  if (clash) {
    return res.status(409).json({
      error: "One or more attendees or the room are unavailable at this time.",
      conflictingBlockId: clash.id,
    });
  }

  const meeting = await Meeting.create({
    id: `mtg_${nanoid(8)}`,
    title,
    date,
    start,
    end,
    attendeeIds,
    roomId,
    agenda: agenda ?? "",
    hasCallLink: false, // explicitly: in-room only, never a video/audio link
  });

  // Reserve the slot so future availability checks reflect it
  const newBlocks = [...attendeeIds, roomId].filter(Boolean).map((ownerId) => ({
    id: `blk_${nanoid(8)}`,
    ownerType: ownerId === roomId ? "room" : "attendee",
    ownerId,
    date,
    start,
    end,
    status: "busy",
  }));
  await BusyBlock.insertMany(newBlocks);

  res.status(201).json(meeting);
});

export default router;
