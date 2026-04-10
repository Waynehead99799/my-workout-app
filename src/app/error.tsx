"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen p-4">
      <div className="ios-card m-auto max-w-md p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Oops!</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {error.message || "Something went wrong"}
        </p>
        <div className="mt-4 flex gap-3 justify-center">
          <button onClick={reset} className="ios-btn ios-btn-primary text-sm">
            Try Again
          </button>
          <Link href="/" className="ios-btn text-sm">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}