import { Schema, model, models } from "mongoose";

const ExerciseChoiceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
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
    selectedLabel: { type: String, required: true },
    selectedVideoUrl: { type: String },
  },
  { timestamps: true }
);

ExerciseChoiceSchema.index({ sessionId: 1, exerciseId: 1 }, { unique: true });

export const ExerciseChoice =
  models.ExerciseChoice || model("ExerciseChoice", ExerciseChoiceSchema);
