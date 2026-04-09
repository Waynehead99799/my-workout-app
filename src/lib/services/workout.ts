import { ProgramTemplate } from "@/lib/models/ProgramTemplate";
import { SetLog } from "@/lib/models/SetLog";
import { WorkoutCycle } from "@/lib/models/WorkoutCycle";
import { WorkoutSession } from "@/lib/models/WorkoutSession";

export async function getOrCreateActiveCycle(userId: string) {
  let cycle = await WorkoutCycle.findOne({ userId, isActive: true }).lean();
  if (!cycle) {
    const latest = await WorkoutCycle.findOne({ userId }).sort({ cycleIndex: -1 }).lean();
    const nextIndex = (latest?.cycleIndex ?? 0) + 1;

    try {
      cycle = await WorkoutCycle.create({
        userId,
        cycleIndex: nextIndex,
        startedAt: new Date(),
        isActive: true,
      });
    } catch (error) {
      const maybeDup = error as { code?: number };
      if (maybeDup.code === 11000) {
        cycle = await WorkoutCycle.findOne({ userId, isActive: true }).lean();
        if (!cycle) {
          cycle = await WorkoutCycle.findOne({ userId }).sort({ cycleIndex: -1 }).lean();
        }
      } else {
        throw error;
      }
    }
  }

  if (!cycle) {
    throw new Error("Unable to create or resolve active workout cycle.");
  }

  return cycle;
}

const DAY_PRIORITY: Record<string, number> = {
  "upper (strength focus)": 1,
  "lower (strength focus)": 2,
  "pull (hypertrophy focus)": 3,
  "push (hypertrophy focus)": 4,
  "legs (hypertrophy focus)": 5,
};

function normalizeDayKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function resolveTemplateDayByProgress(progressIndex: number) {
  const all = await ProgramTemplate.find({}, { weekNumber: 1, dayKey: 1 })
    .sort({ weekNumber: 1, dayKey: 1 })
    .lean();

  const uniqueDays = Array.from(
    new Map(all.map((x) => [`${x.weekNumber}|${x.dayKey}`, x])).values()
  ).filter((x) => x.dayKey && !/rest/i.test(x.dayKey));

  if (!uniqueDays.length) {
    return null;
  }

  uniqueDays.sort((a, b) => {
    if (a.weekNumber !== b.weekNumber) {
      return a.weekNumber - b.weekNumber;
    }

    const aRank = DAY_PRIORITY[normalizeDayKey(a.dayKey)] ?? 999;
    const bRank = DAY_PRIORITY[normalizeDayKey(b.dayKey)] ?? 999;
    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return a.dayKey.localeCompare(b.dayKey);
  });

  const index = ((progressIndex % uniqueDays.length) + uniqueDays.length) % uniqueDays.length;
  return uniqueDays[index];
}

export async function computeSessionDone(sessionId: string) {
  const session = await WorkoutSession.findById(sessionId).lean();
  if (!session) {
    return false;
  }

  const [templates, counts] = await Promise.all([
    ProgramTemplate.find({ _id: { $in: session.plannedExerciseIds } }).lean(),
    SetLog.aggregate([
      { $match: { sessionId: session._id, setType: "working" } },
      { $group: { _id: "$exerciseId", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((c: { _id: unknown; count: number }) => [String(c._id), c.count]));

  const isDone = templates.every((t) => {
    const required = Number(t.workingSets ?? 0);
    return (countMap.get(String(t._id)) ?? 0) >= required;
  });

  await WorkoutSession.updateOne({ _id: sessionId }, { isDone });
  return isDone;
}
