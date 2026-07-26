import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    role: String,
    initials: String,
  },
  { versionKey: false }
);
attendeeSchema.set("toJSON", { transform: (doc, ret) => { delete ret._id; return ret; } });

export default mongoose.model("Attendee", attendeeSchema);
