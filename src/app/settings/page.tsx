import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { TopBar } from "@/components/topbar";
import { RestartCycle } from "@/components/restart-cycle";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main>
      <TopBar title="Settings" />
      <div className="p-4">
        <RestartCycle />
      </div>
    </main>
  );
}
