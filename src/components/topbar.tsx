"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between p-4">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="ios-btn px-3 py-1 text-sm"
        >
          Logout
        </button>
      </div>
      <div className="mx-auto hidden max-w-4xl gap-4 px-4 pb-3 md:flex">
        <Link href="/dashboard" className="text-sm text-zinc-700 hover:text-zinc-950">
          Dashboard
        </Link>
        <Link href="/calendar" className="text-sm text-zinc-700 hover:text-zinc-950">
          Calendar
        </Link>
        <Link href="/progress/compare" className="text-sm text-zinc-700 hover:text-zinc-950">
          Compare
        </Link>
        <Link href="/settings" className="text-sm text-zinc-700 hover:text-zinc-950">
          Settings
        </Link>
      </div>
    </header>
  );
}
