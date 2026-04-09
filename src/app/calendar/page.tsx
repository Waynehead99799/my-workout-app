import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { TopBar } from "@/components/topbar";
import { CalendarClient } from "@/components/calendar-client";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main>
      <TopBar title="Calendar" />
      <div className="p-4">
        <CalendarClient />
      </div>
    </main>
  );
}
