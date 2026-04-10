"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ErrorBoundary caught:", error);
  }, [error]);

  return (
    <div className="ios-card m-4 p-6 text-center">
      <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
      <p className="mt-2 text-sm text-zinc-600">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        className="ios-btn ios-btn-primary mt-4"
      >
        Try again
      </button>
    </div>
  );
}