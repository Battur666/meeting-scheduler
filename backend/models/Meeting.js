import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    attendeeIds: { type: [String], default: [] },
    roomId: String,
    agenda: { type: String, default: "" },
    hasCallLink: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
meetingSchema.set("toJSON", { transform: (doc, ret) => { delete ret._id; return ret; } });

export default mongoose.model("Meeting", meetingSchema);
