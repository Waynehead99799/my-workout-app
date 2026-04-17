"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import dayjs from "dayjs";
import Link from "next/link";

type SessionDay = { sessionDate: string; isDone: boolean };

export function CalendarClient() {
  const [value, setValue] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<SessionDay[]>([]);

  const monthKey = dayjs(value).format("YYYY-MM");

  useEffect(() => {
    fetch(`/api/sessions?month=${monthKey}`)
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []));
  }, [monthKey]);

  const doneMap = useMemo(() => new Map(sessions.map((s) => [s.sessionDate, s.isDone])), [sessions]);
  const selectedDate = dayjs(value).format("YYYY-MM-DD");

  return (
    <div className="space-y-4">
      <div className="ios-card p-3">
        <Calendar
          className="ios-calendar"
          value={value}
          onChange={(next) => setValue(next as Date)}
          formatShortWeekday={(_, date) => dayjs(date).format("dd")}
          tileClassName={({ date }) => {
            const key = dayjs(date).format("YYYY-MM-DD");
            const isDone = doneMap.get(key);
            return isDone
              ? "ios-day-done"
              : "ios-day-default";
          }}
          tileContent={() => null}
        />
      </div>

      <div className="ios-card p-4">
        <p className="text-sm text-zinc-600">Selected date: {selectedDate}</p>
        <p className="mt-1 text-sm">
          Status:{" "}
          {doneMap.has(selectedDate)
            ? doneMap.get(selectedDate)
              ? "Done"
              : "In progress"
            : "No logs yet"}
        </p>
        <Link
          href={`/workout/${selectedDate}`}
          className="ios-btn ios-btn-primary mt-3 inline-block text-sm"
        >
          Open Workout Day
        </Link>
      </div>
    </div>
  );
}
