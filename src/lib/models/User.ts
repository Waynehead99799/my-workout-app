import { Schema, model, models } from "mongoose";

export type UserRole = "user";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user"], default: "user" },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
