import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { WorkoutSession } from "@/lib/models/WorkoutSession";
import { computeSessionDone } from "@/lib/services/workout";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  await connectDb();
  const target = await WorkoutSession.findById(id);
  if (!target || target.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const isDone = await computeSessionDone(id);
  return NextResponse.json({ isDone });
}
