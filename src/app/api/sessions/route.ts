import dayjs from "dayjs";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { ProgramTemplate } from "@/lib/models/ProgramTemplate";
import { SetLog } from "@/lib/models/SetLog";
import { WorkoutSession } from "@/lib/models/WorkoutSession";
import { getOrCreateActiveCycle, resolveTemplateDayByProgress } from "@/lib/services/workout";

function clampSetCount(value: unknown, fallback: number) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  const rounded = Math.floor(num);
  if (rounded < 0) {
    return 0;
  }
  return Math.min(rounded, 6);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionDate = String(body.date ?? dayjs().format("YYYY-MM-DD"));

    await connectDb();

    const cycle = await getOrCreateActiveCycle(session.user.id);
    const existingSession = await WorkoutSession.findOne({
      userId: session.user.id,
      cycleId: cycle._id,
      sessionDate,
    });

    if (existingSession) {
      const [existingTemplates, existingLogs] = await Promise.all([
        ProgramTemplate.find({
          weekNumber: existingSession.weekNumber,
          dayKey: existingSession.dayKey,
        }).lean(),
        SetLog.find({
          sessionId: existingSession._id,
          setType: "working",
        })
          .select("exerciseId setType setNumber weight actualReps")
          .lean(),
      ]);

      const logs = existingLogs.map((log) => ({
        ...log,
        exerciseId: String(log.exerciseId),
      }));

      return NextResponse.json({ session: existingSession, exercises: existingTemplates, logs });
    }

    const completedWorkoutsCount = await WorkoutSession.countDocuments({
      userId: session.user.id,
      cycleId: cycle._id,
    });

    const templateDay = await resolveTemplateDayByProgress(completedWorkoutsCount);
    if (!templateDay) {
      return NextResponse.json({ error: "No program data found." }, { status: 400 });
    }

    const dayTemplatesRaw = await ProgramTemplate.find({
      weekNumber: templateDay.weekNumber,
      dayKey: templateDay.dayKey,
    }).lean();

    if (!dayTemplatesRaw.length) {
      return NextResponse.json(
        { error: "No exercises found for this training day." },
        { status: 400 }
      );
    }

    const dayTemplates = dayTemplatesRaw.map((item) => ({
      ...item,
      warmupSets: clampSetCount(item.warmupSets, 0),
      workingSets: clampSetCount(item.workingSets, 1),
    }));

    const sessionDoc = await WorkoutSession.findOneAndUpdate(
      {
        userId: session.user.id,
        cycleId: cycle._id,
        sessionDate,
      },
      {
        $setOnInsert: {
          userId: session.user.id,
          cycleId: cycle._id,
          sessionDate,
          weekNumber: templateDay.weekNumber,
          dayKey: templateDay.dayKey,
          plannedExerciseIds: dayTemplates.map((e) => e._id),
          isDone: false,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    const existingLogs = await SetLog.find({
      sessionId: sessionDoc?._id,
      setType: "working",
    })
      .select("exerciseId setType setNumber weight actualReps")
      .lean();

    const logs = existingLogs.map((log) => ({
      ...log,
      exerciseId: String(log.exerciseId),
    }));

    return NextResponse.json({ session: sessionDoc, exercises: dayTemplates, logs });
  } catch (error) {
    console.error("POST /api/sessions failed", error);
    return NextResponse.json({ error: "Failed to open workout session." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month is required." }, { status: 400 });
  }

  await connectDb();
  const start = `${month}-01`;
  const end = dayjs(start).endOf("month").format("YYYY-MM-DD");
  const sessions = await WorkoutSession.find({
    userId: session.user.id,
    sessionDate: { $gte: start, $lte: end },
  })
    .select("sessionDate isDone")
    .lean();

  return NextResponse.json({ sessions });
}
