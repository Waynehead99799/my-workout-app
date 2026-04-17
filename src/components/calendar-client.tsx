"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import dayjs from "dayjs";
import Link from "next/link";

type SessionDay = { sessionDate: string; isDone: boolean };

export function CalendarClient() {
  const [value, setValue] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<SessionDay[]>([]);
  const [cycleStartDate, setCycleStartDate] = useState<string | null>(null);

  const monthKey = dayjs(value).format("YYYY-MM");

  useEffect(() => {
    fetch(`/api/sessions?month=${monthKey}`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        if (data.cycleStartDate) setCycleStartDate(data.cycleStartDate);
      });
  }, [monthKey]);

  const doneMap = useMemo(() => new Map(sessions.map((s) => [s.sessionDate, s.isDone])), [sessions]);
  const today = dayjs().format("YYYY-MM-DD");
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
            if (doneMap.has(key)) {
              return doneMap.get(key) ? "ios-day-done" : "ios-day-inprogress";
            }
            const isPast = key < today && cycleStartDate && key >= cycleStartDate;
            return isPast ? "ios-day-off" : "ios-day-default";
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
              ? "✅ Done"
              : "🏋️ In progress"
            : selectedDate < today && cycleStartDate && selectedDate >= cycleStartDate
              ? "😴 Off / Break day"
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
