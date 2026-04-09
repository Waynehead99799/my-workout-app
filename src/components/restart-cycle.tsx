"use client";

import { useState } from "react";

export function RestartCycle() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function restart() {
    setLoading(true);
    const res = await fetch("/api/cycles/restart", { method: "POST" });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(body.error ?? "Failed to restart.");
      return;
    }
    setMessage(`Started cycle #${body.cycle.cycleIndex}`);
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="font-semibold">Restart Workout Cycle</h2>
      <p className="mt-1 text-sm text-zinc-600">
        This starts a new cycle and keeps old cycle data for comparison.
      </p>
      <button
        type="button"
        onClick={restart}
        disabled={loading}
        className="mt-3 rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {loading ? "Restarting..." : "Start New Cycle"}
      </button>
      {message ? <p className="mt-2 text-sm">{message}</p> : null}
    </div>
  );
}
