import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./db.js";
import Room from "./models/Room.js";

import attendeesRouter from "./routes/attendees.js";
import roomsRouter from "./routes/rooms.js";
import meetingsRouter from "./routes/meetings.js";
import availabilityRouter from "./routes/availability.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import { requireEmployee } from "./lib/auth.js";

const PORT = process.env.PORT || 4000;

await connectDB();

// Seed the single bookable room if it doesn't exist yet
await Room.findOneAndUpdate(
  { id: "room_1" },
  { id: "room_1", name: "Toki Zadgai", floor: null, capacity: null, features: [] },
  { upsert: true }
);

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

app.use("/api/attendees", requireEmployee, attendeesRouter);
app.use("/api/rooms", requireEmployee, roomsRouter);
app.use("/api/meetings", requireEmployee, meetingsRouter);
app.use("/api/availability", requireEmployee, availabilityRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Meeting Scheduler API running on http://localhost:${PORT}`);
});
