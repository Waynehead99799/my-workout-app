import { Schema, model, models } from "mongoose";

const SubstitutionSchema = new Schema(
  {
    label: { type: String, required: true },
    videoUrl: { type: String },
    youtubeId: { type: String },
  },
  { _id: false }
);

const ProgramTemplateSchema = new Schema(
  {
    weekNumber: { type: Number, required: true, index: true },
    dayKey: { type: String, required: true, index: true },
    exerciseName: { type: String, required: true },
    exerciseVideoUrl: { type: String },
    exerciseYoutubeId: { type: String },
    intensityTechnique: { type: String },
    warmupSets: { type: Number, default: 0 },
    workingSets: { type: Number, required: true },
    reps: { type: String, required: true },
    earlySetRpe: { type: String },
    lastSetRpe: { type: String },
    rest: { type: String },
    substitutions: { type: [SubstitutionSchema], default: [] },
    notes: { type: String },
    rowHash: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

export const ProgramTemplate =
  models.ProgramTemplate || model("ProgramTemplate", ProgramTemplateSchema);
