import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { TopBar } from "@/components/topbar";
import { RestartCycle } from "@/components/restart-cycle";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main>
      <TopBar title="Settings" />
      <div className="space-y-4 p-4">
        <ThemeToggle />
        <RestartCycle />
      </div>
    </main>
  );
}
