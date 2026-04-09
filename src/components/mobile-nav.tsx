"use client";

import { Home, CalendarDays, BarChart3, Settings, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { LimelightNav, type NavItem } from "@/components/ui/limelight-nav";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/calendar", label: "Calendar" },
  { href: "/workout/today", label: "Log" },
  { href: "/progress/compare", label: "Compare" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;
  const items: NavItem[] = [
    { id: "home", label: "Home", icon: <Home />, onClick: () => router.push("/dashboard") },
    { id: "calendar", label: "Calendar", icon: <CalendarDays />, onClick: () => router.push("/calendar") },
    {
      id: "log",
      label: "Log Today",
      icon: <Plus />,
      onClick: () => router.push("/workout/today"),
      isPrimaryAction: true,
    },
    {
      id: "compare",
      label: "Compare",
      icon: <BarChart3 />,
      onClick: () => router.push("/progress/compare"),
    },
    { id: "settings", label: "Settings", icon: <Settings />, onClick: () => router.push("/settings") },
  ];
  const activeIndex = links.findIndex((link) => pathname.startsWith(link.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex w-full max-w-sm justify-center">
        <LimelightNav
          items={items}
          activeIndex={activeIndex}
          className="glass-nav h-[58px] w-full rounded-[20px]"
        />
      </div>
    </nav>
  );
}
