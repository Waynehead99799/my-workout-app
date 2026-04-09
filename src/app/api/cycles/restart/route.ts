import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { WorkoutCycle } from "@/lib/models/WorkoutCycle";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDb();
  const active = await WorkoutCycle.findOne({ userId: session.user.id, isActive: true });
  if (active) {
    active.isActive = false;
    active.endedAt = new Date();
    await active.save();
  }

  const latest = await WorkoutCycle.findOne({ userId: session.user.id }).sort({ cycleIndex: -1 });
  const nextIndex = (latest?.cycleIndex ?? 0) + 1;

  const created = await WorkoutCycle.create({
    userId: session.user.id,
    cycleIndex: nextIndex,
    startedAt: new Date(),
    isActive: true,
  });

  return NextResponse.json({ cycle: created });
}
