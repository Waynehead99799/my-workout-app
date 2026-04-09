import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { SetLog } from "@/lib/models/SetLog";
import { WorkoutSession } from "@/lib/models/WorkoutSession";
import { computeSessionDone } from "@/lib/services/workout";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    sessionId,
    exerciseId,
    setType,
    setNumber,
    weight,
    actualReps,
    targetRepRange,
    isToFailure,
  } = body;

  await connectDb();
  const workoutSession = await WorkoutSession.findById(sessionId);
  if (!workoutSession || workoutSession.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const log = await SetLog.findOneAndUpdate(
    { sessionId, exerciseId, setType, setNumber },
    {
      userId: session.user.id,
      cycleId: workoutSession.cycleId,
      sessionId,
      exerciseId,
      setType,
      setNumber,
      weight: Number(weight),
      actualReps: actualReps ? Number(actualReps) : undefined,
      targetRepRange,
      isToFailure: Boolean(isToFailure),
      completedAt: new Date(),
    },
    { upsert: true, returnDocument: "after" }
  );

  const isDone = await computeSessionDone(sessionId);
  return NextResponse.json({ log, isDone });
}
