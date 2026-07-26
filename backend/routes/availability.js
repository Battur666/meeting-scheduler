import { Router } from "express";
import Attendee from "../models/Attendee.js";
import Room from "../models/Room.js";
import BusyBlock from "../models/BusyBlock.js";

const router = Router();

const DAY_START = "07:00";
const DAY_END = "19:00";

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// GET /api/availability?date=2026-07-16&attendeeIds=att_1,att_2&roomId=room_1
router.get("/", async (req, res) => {
  const { date, attendeeIds = "", roomId } = req.query;
  const ids = attendeeIds.split(",").filter(Boolean);

  const rows = await Promise.all(
    ids.map(async (id) => {
      const person = await Attendee.findOne({ id });
      const blocks = await BusyBlock.find({ ownerType: "attendee", ownerId: id, date });
      return { id, name: person?.name ?? id, blocks };
    })
  );

  if (roomId) {
    const room = await Room.findOne({ id: roomId });
    const blocks = await BusyBlock.find({ ownerType: "room", ownerId: roomId, date });
    rows.push({ id: roomId, name: `${room?.name ?? roomId} (room)`, isRoom: true, blocks });
  }

  // Suggest times: scan every 15-min slot in the working day for a given duration
  const duration = Number(req.query.durationMinutes || 45);
  const suggestions = [];
  for (let t = toMinutes(DAY_START); t + duration <= toMinutes(DAY_END); t += 15) {
    const slotStart = t;
    const slotEnd = t + duration;
    let conflicts = 0;
    let requiredConflict = false;

    for (const row of rows) {
      const clash = row.blocks.some(
        (b) => toMinutes(b.start) < slotEnd && toMinutes(b.end) > slotStart
      );
      if (clash) {
        conflicts += 1;
        if (!row.isRoom) requiredConflict = true; // treat all passed attendees as required here
      }
    }

    suggestions.push({
      start: minutesToLabel(slotStart),
      end: minutesToLabel(slotEnd),
      conflicts,
      requiredConflict,
    });
  }

  const best = suggestions
    .filter((s) => s.conflicts === 0)
    .slice(0, 3);
  const fallback = suggestions
    .sort((a, b) => a.conflicts - b.conflicts)
    .slice(0, 3);

  res.json({
    date,
    dayStart: DAY_START,
    dayEnd: DAY_END,
    rows,
    suggestions: best.length ? best : fallback,
  });
});

function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export default router;
