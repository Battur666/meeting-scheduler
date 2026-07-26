import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    floor: { type: Number, default: null },
    capacity: { type: Number, default: null },
    features: { type: [String], default: [] },
  },
  { versionKey: false }
);
roomSchema.set("toJSON", { transform: (doc, ret) => { delete ret._id; return ret; } });

export default mongoose.model("Room", roomSchema);
