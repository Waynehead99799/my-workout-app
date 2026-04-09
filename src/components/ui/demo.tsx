"use client";

import { Bookmark, Home, PlusCircle, Settings, User } from "lucide-react";
import { LimelightNav, type NavItem } from "@/components/ui/limelight-nav";

const customNavItems: NavItem[] = [
  { id: "home", icon: <Home />, label: "Home", onClick: () => console.log("Home Clicked!") },
  {
    id: "bookmark",
    icon: <Bookmark />,
    label: "Bookmarks",
    onClick: () => console.log("Bookmark Clicked!"),
  },
  { id: "add", icon: <PlusCircle />, label: "Add New", onClick: () => console.log("Add Clicked!") },
  { id: "profile", icon: <User />, label: "Profile", onClick: () => console.log("Profile Clicked!") },
  { id: "settings", icon: <Settings />, label: "Settings", onClick: () => console.log("Settings Clicked!") },
];

export const Customized = () => {
  return (
    <LimelightNav
      className="rounded-xl bg-secondary dark:border-accent/50 dark:bg-card/50"
      items={customNavItems}
    />
  );
};

export const Default = () => {
  return <LimelightNav />;
};
