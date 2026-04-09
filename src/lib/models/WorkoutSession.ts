import { Schema, model, models } from "mongoose";

const WorkoutSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "WorkoutCycle",
      required: true,
      index: true,
    },
    sessionDate: { type: String, required: true, index: true },
    weekNumber: { type: Number, required: true },
    dayKey: { type: String, required: true },
    plannedExerciseIds: [{ type: Schema.Types.ObjectId, ref: "ProgramTemplate" }],
    isDone: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

WorkoutSessionSchema.index({ userId: 1, cycleId: 1, sessionDate: 1 }, { unique: true });

export const WorkoutSession =
  models.WorkoutSession || model("WorkoutSession", WorkoutSessionSchema);
