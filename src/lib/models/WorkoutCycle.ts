import { Schema, model, models } from "mongoose";

const WorkoutCycleSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cycleIndex: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

WorkoutCycleSchema.index({ userId: 1, cycleIndex: 1 }, { unique: true });

export const WorkoutCycle =
  models.WorkoutCycle || model("WorkoutCycle", WorkoutCycleSchema);
