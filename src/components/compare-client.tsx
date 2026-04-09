"use client";

import { useEffect, useState } from "react";

type CompareRow = {
  key: string;
  deltaVolume: number;
  deltaMaxWeight: number;
  deltaSets: number;
  latest: { volume: number; maxWeight: number; sets: number };
  previous: { volume: number; maxWeight: number; sets: number };
};

export function CompareClient() {
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [title, setTitle] = useState("Latest vs Previous");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/compare/latest-vs-previous")
      .then((r) => r.json())
      .then((data) => {
        if (data.message) {
          setMessage(data.message);
        }
        setTitle(`Cycle ${data.latestCycle ?? "-"} vs ${data.previousCycle ?? "-"}`);
        setRows(data.comparisons ?? []);
      });
  }, []);

  if (message) {
    return <p className="ios-card p-4 text-sm">{message}</p>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {rows.map((row) => (
        <article key={row.key} className="ios-card p-4">
          <p className="text-sm font-semibold">{row.key}</p>
          <p className="mt-1 text-xs">Volume: {row.previous.volume} → {row.latest.volume}</p>
          <p className="text-xs">Max weight: {row.previous.maxWeight} → {row.latest.maxWeight}</p>
          <p className="text-xs">Sets: {row.previous.sets} → {row.latest.sets}</p>
          <p className={`mt-1 text-xs ${row.deltaVolume >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            Delta volume: {row.deltaVolume}
          </p>
        </article>
      ))}
    </div>
  );
}
