import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { TopBar } from "@/components/topbar";
import { WorkoutDayClient } from "@/components/workout-day-client";

export default async function WorkoutDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { date } = await params;

  return (
    <main>
      <TopBar title="Workout Day" />
      <div className="p-4">
        <WorkoutDayClient dateParam={date} />
      </div>
    </main>
  );
}
