import Link from "next/link";
import dayjs from "dayjs";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { WorkoutCycle } from "@/lib/models/WorkoutCycle";
import { WorkoutSession } from "@/lib/models/WorkoutSession";
import { resolveTemplateDayByProgress } from "@/lib/services/workout";
import { TopBar } from "@/components/topbar";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  await connectDb();
  const cycle = await WorkoutCycle.findOne({ userId: user.id, isActive: true }).lean();

  let doneCount = 0;
  let todaysWorkoutKey = "";

  if (cycle) {
    const today = dayjs().format("YYYY-MM-DD");
    const [done, todaysSession, progress] = await Promise.all([
      WorkoutSession.countDocuments({ userId: user.id, cycleId: cycle._id, isDone: true }),
      WorkoutSession.findOne({ userId: user.id, cycleId: cycle._id, sessionDate: today }).select("dayKey").lean(),
      WorkoutSession.countDocuments({ userId: user.id, cycleId: cycle._id }),
    ]);
    doneCount = done;

    if (todaysSession?.dayKey) {
      todaysWorkoutKey = todaysSession.dayKey;
    } else {
      const nextTemplateDay = await resolveTemplateDayByProgress(progress);
      todaysWorkoutKey = nextTemplateDay?.dayKey ?? "";
    }
  }

  return (
    <main>
      <TopBar title="Dashboard" />
      <div className="space-y-4 p-4">
        <section className="ios-card p-5">
          <h2 className="text-2xl font-semibold tracking-tight">Welcome, {user.name ?? "Athlete"}</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Active cycle {cycle?.cycleIndex ?? "Not started"} · {doneCount} completed days
          </p>
          {todaysWorkoutKey ? (
            <p className="mt-1 text-sm text-zinc-700">Today: {todaysWorkoutKey}</p>
          ) : null}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link href="/calendar" className="ios-btn ios-btn-primary text-center text-sm">
              Open Calendar
            </Link>
            <Link href="/workout/today" className="ios-btn text-center text-sm">
              Log Today Workout
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
