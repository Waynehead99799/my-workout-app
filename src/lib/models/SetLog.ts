import { Schema, model, models } from "mongoose";

const SetLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cycleId: { type: Schema.Types.ObjectId, ref: "WorkoutCycle", required: true, index: true },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "WorkoutSession",
      required: true,
      index: true,
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "ProgramTemplate",
      required: true,
      index: true,
    },
    setType: { type: String, enum: ["warmup", "working"], required: true },
    setNumber: { type: Number, required: true },
    targetRepRange: { type: String },
    actualReps: { type: Number },
    weight: { type: Number, required: true },
    rpe: { type: Number },
    isToFailure: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SetLogSchema.index(
  { sessionId: 1, exerciseId: 1, setType: 1, setNumber: 1 },
  { unique: true }
);
SetLogSchema.index({ userId: 1, cycleId: 1 });
SetLogSchema.index({ sessionId: 1, setType: 1 });
SetLogSchema.index({ completedAt: -1 });
SetLogSchema.index({ userId: 1, completedAt: -1 });

export const SetLog = models.SetLog || model("SetLog", SetLogSchema);
