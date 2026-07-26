import mongoose from "mongoose";

const busyBlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    ownerType: { type: String, enum: ["attendee", "room"], required: true },
    ownerId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    status: { type: String, default: "busy" },
  },
  { versionKey: false }
);
busyBlockSchema.set("toJSON", { transform: (doc, ret) => { delete ret._id; return ret; } });

export default mongoose.model("BusyBlock", busyBlockSchema);
