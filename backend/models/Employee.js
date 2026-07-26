import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    lastname: String,
    firstname: String,
    phone: { type: String, required: true, index: true },
    department: String,
    company: String,
  },
  { versionKey: false }
);
employeeSchema.set("toJSON", { transform: (doc, ret) => { delete ret._id; return ret; } });

export default mongoose.model("Employee", employeeSchema);
