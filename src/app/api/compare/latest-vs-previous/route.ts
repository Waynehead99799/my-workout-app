import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { ProgramTemplate } from "@/lib/models/ProgramTemplate";
import { SetLog } from "@/lib/models/SetLog";
import { WorkoutCycle } from "@/lib/models/WorkoutCycle";
import { WorkoutSession } from "@/lib/models/WorkoutSession";

type CycleStats = Record<string, { volume: number; maxWeight: number; sets: number }>;

async function getCycleStats(userId: string, cycleId: string): Promise<CycleStats> {
  const sessions = await WorkoutSession.find({ userId, cycleId }).select("_id dayKey weekNumber").lean();
  const bySession = new Map(sessions.map((s) => [String(s._id), `${s.weekNumber}|${s.dayKey}`]));
  const logs = await SetLog.find({ userId, cycleId })
    .select("sessionId exerciseId weight actualReps")
    .lean();
  const exerciseIds = Array.from(new Set(logs.map((l) => String(l.exerciseId))));
  const templates = await ProgramTemplate.find({ _id: { $in: exerciseIds } })
    .select("_id exerciseName")
    .lean();
  const byExercise = new Map(templates.map((t) => [String(t._id), t.exerciseName]));

  const stats: CycleStats = {};
  for (const log of logs) {
    const day = bySession.get(String(log.sessionId));
    const exerciseName = byExercise.get(String(log.exerciseId)) ?? "Exercise";
    const key = day ? `${day}|${exerciseName}` : null;
    if (!key) {
      continue;
    }
    const reps = Number(log.actualReps ?? 0);
    const weight = Number(log.weight ?? 0);
    if (!stats[key]) {
      stats[key] = { volume: 0, maxWeight: 0, sets: 0 };
    }
    stats[key].volume += weight * reps;
    stats[key].maxWeight = Math.max(stats[key].maxWeight, weight);
    stats[key].sets += 1;
  }

  return stats;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDb();
  const cycles = await WorkoutCycle.find({ userId: session.user.id }).sort({ cycleIndex: -1 }).limit(2).lean();
  if (cycles.length < 2) {
    return NextResponse.json({ comparisons: [], message: "Need at least two cycles." });
  }

  const latest = cycles[0];
  const previous = cycles[1];

  const latestStats = await getCycleStats(session.user.id, String(latest._id));
  const previousStats = await getCycleStats(session.user.id, String(previous._id));

  const keys = Array.from(new Set([...Object.keys(latestStats), ...Object.keys(previousStats)]));
  const comparisons = keys.map((key) => {
    const cur = latestStats[key] ?? { volume: 0, maxWeight: 0, sets: 0 };
    const prev = previousStats[key] ?? { volume: 0, maxWeight: 0, sets: 0 };
    return {
      key,
      latest: cur,
      previous: prev,
      deltaVolume: cur.volume - prev.volume,
      deltaMaxWeight: cur.maxWeight - prev.maxWeight,
      deltaSets: cur.sets - prev.sets,
    };
  });

  return NextResponse.json({
    latestCycle: latest.cycleIndex,
    previousCycle: previous.cycleIndex,
    comparisons,
  });
}
