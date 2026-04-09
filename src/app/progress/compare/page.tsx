import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { TopBar } from "@/components/topbar";
import { CompareClient } from "@/components/compare-client";

export default async function ComparePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main>
      <TopBar title="Cycle Comparison" />
      <div className="p-4">
        <CompareClient />
      </div>
    </main>
  );
}
