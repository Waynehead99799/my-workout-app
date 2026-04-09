"use client";

import { Home, CalendarDays, BarChart3, Settings, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LimelightNav, type NavItem } from "@/components/ui/limelight-nav";

const navLinks = [
  { id: "home", href: "/dashboard", label: "Home", icon: Home },
  { id: "calendar", href: "/calendar", label: "Calendar", icon: CalendarDays },
  { id: "log", href: "/workout/today", label: "Log Today", icon: Plus, isPrimaryAction: true },
  { id: "compare", href: "/progress/compare", label: "Compare", icon: BarChart3 },
  { id: "settings", href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;
  const items: NavItem[] = navLinks.map(({ id, href, label, icon: Icon, isPrimaryAction }) => ({
    id,
    label,
    icon: <Icon />,
    href,
    isPrimaryAction,
  }));
  const activeIndex = navLinks.findIndex((link) => pathname.startsWith(link.href));

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
