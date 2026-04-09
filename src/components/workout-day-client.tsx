"use client";

import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";

type Exercise = {
  _id: string;
  exerciseName: string;
  exerciseYoutubeId?: string;
  intensityTechnique?: string;
  warmupSets: number;
  workingSets: number;
  reps: string;
  lastSetRpe?: string;
  notes?: string;
  substitutions?: { label: string; youtubeId?: string }[];
};

type ExistingLog = {
  exerciseId: string;
  setType: "working";
  setNumber: number;
  weight?: number;
  actualReps?: number;
};

type SetDraft = {
  weight?: string;
  reps?: string;
};

function getRpeCardClass(lastSetRpe?: string) {
  const value = String(lastSetRpe ?? "").toLowerCase();

  // ~8-9 => near failure (0-1 RIR): subtle red tint
  if (value.includes("8-9")) {
    return "border-rose-200 bg-rose-50/35";
  }

  // ~7-8 => around 2 RIR: subtle amber tint
  if (value.includes("7-8")) {
    return "border-amber-200 bg-amber-50/35";
  }

  // ~6-7 => easier sets: subtle blue tint
  if (value.includes("6-7")) {
    return "border-sky-200 bg-sky-50/35";
  }

  return "border-zinc-200 bg-white";
}

export function WorkoutDayClient({ dateParam }: { dateParam: string }) {
  const date = dateParam === "today" ? dayjs().format("YYYY-MM-DD") : dateParam;
  const [sessionId, setSessionId] = useState<string>("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [openVideo, setOpenVideo] = useState<string | null>(null);
  const [openAlternatives, setOpenAlternatives] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});
  const [weekNumber, setWeekNumber] = useState<number | null>(null);
  const [dayKey, setDayKey] = useState<string>("");

  useEffect(() => {
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error || !data.session?._id || !Array.isArray(data.exercises)) {
          setMessage(data.error ?? "Could not load today's workout.");
          return;
        }
        setSessionId(data.session._id);
        setExercises(data.exercises);
        setWeekNumber(typeof data.session.weekNumber === "number" ? data.session.weekNumber : null);
        setDayKey(String(data.session.dayKey ?? ""));

        const initialSaved: Record<string, boolean> = {};
        const initialDrafts: Record<string, SetDraft> = {};
        const logs = (data.logs ?? []) as ExistingLog[];
        for (const log of logs) {
          const key = `${log.exerciseId}-${log.setType}-${log.setNumber}`;
          initialSaved[key] = true;
          initialDrafts[key] = {
            weight: log.weight != null ? String(log.weight) : "",
            reps: log.actualReps != null ? String(log.actualReps) : "",
          };
        }
        setSaved(initialSaved);
        setDrafts(initialDrafts);
      })
      .catch(() => {
        setMessage("Could not open workout session. Please refresh.");
      });
  }, [date]);

  async function logSet(
    exerciseId: string,
    setType: "warmup" | "working",
    setNumber: number,
    values: SetDraft
  ) {
    const fieldKey = `${exerciseId}-${setType}-${setNumber}`;
    const weightRaw = String(values.weight ?? "").trim();
    const repsRaw = String(values.reps ?? "").trim();
    const weight = Number(weightRaw);
    const reps = repsRaw ? Number(repsRaw) : undefined;
    const res = await fetch("/api/set-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        exerciseId,
        setType,
        setNumber,
        weight,
        actualReps: reps,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      setMessage(body.error ?? "Failed to save set.");
      return;
    }
    setSaved((s) => ({ ...s, [fieldKey]: true }));
    setDrafts((prev) => ({
      ...prev,
      [fieldKey]: {
        weight: weightRaw,
        reps: repsRaw,
      },
    }));
    setMessage(body.isDone ? "Great! Day completed and marked done." : "Set saved.");
  }

  const isLoading = exercises.length === 0 && !message;

  if (isLoading) {
    return (
      <section className="space-y-4 animate-pulse">
        {/* Date + week line */}
        <div className="h-4 w-32 rounded bg-zinc-200" />
        <div className="h-3 w-24 rounded bg-zinc-200" />

        {/* Exercise card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
            {/* Title + toggle */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-44 rounded bg-zinc-200" />
              <div className="h-6 w-11 rounded-full bg-zinc-200" />
            </div>
            {/* Meta line */}
            <div className="h-3 w-56 rounded bg-zinc-200" />
            {/* Video button */}
            <div className="h-8 w-full rounded-lg bg-zinc-100" />
            {/* Set forms */}
            {[1, 2].map((j) => (
              <div key={j} className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-12 rounded bg-zinc-200" />
                  <div className="h-3 w-10 rounded bg-zinc-200" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-9 rounded-lg bg-zinc-100" />
                  <div className="h-9 rounded-lg bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>
    );
  }

  const rendered = exercises.map((exercise) => (
        <article
          key={exercise._id}
          className={`rounded-xl border p-4 ${getRpeCardClass(exercise.lastSetRpe)}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold">{exercise.exerciseName}</h3>
            {exercise.substitutions?.length ? (
              <button
                type="button"
                onClick={() =>
                  setOpenAlternatives((prev) => ({
                    ...prev,
                    [exercise._id]: !prev[exercise._id],
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  openAlternatives[exercise._id] ? "bg-zinc-900" : "bg-zinc-300"
                }`}
                aria-label={`Toggle alternatives for ${exercise.exerciseName}`}
                aria-pressed={Boolean(openAlternatives[exercise._id])}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    openAlternatives[exercise._id] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            {exercise.workingSets} working sets | {exercise.reps} reps | Last set RPE{" "}
            {exercise.lastSetRpe ?? "-"}
          </p>
          {exercise.intensityTechnique ? (
            <p className="mt-1 text-xs text-zinc-600">Intensity: {exercise.intensityTechnique}</p>
          ) : null}
          {exercise.notes ? <p className="mt-1 text-xs text-zinc-600">{exercise.notes}</p> : null}

          {exercise.exerciseYoutubeId ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={() =>
                  setOpenVideo((current) => (current === exercise._id ? null : exercise._id))
                }
                className="ios-btn w-full text-xs"
              >
                {openVideo === exercise._id ? "Hide demo video" : "Show demo video"}
              </button>
              {openVideo === exercise._id ? (
                <div className="mt-2 overflow-hidden rounded-lg">
                  <iframe
                    className="aspect-video w-full"
                    loading="lazy"
                    src={`https://www.youtube.com/embed/${exercise.exerciseYoutubeId}?autoplay=0&mute=1&loop=1&playlist=${exercise.exerciseYoutubeId}`}
                    title={exercise.exerciseName}
                    allow="encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {exercise.substitutions?.length ? (
            <div className="mt-3">
              {openAlternatives[exercise._id] ? (
                <div className="mt-2 space-y-2">
                  {exercise.substitutions.map((sub) => (
                    <div key={sub.label} className="rounded-lg bg-zinc-50 p-2.5">
                      <p className="text-xs font-medium text-zinc-700">Alternative: {sub.label}</p>
                      {sub.youtubeId ? (
                        <iframe
                          className="mt-2 aspect-video w-full rounded-md"
                          loading="lazy"
                          src={`https://www.youtube.com/embed/${sub.youtubeId}?autoplay=0&mute=1&loop=1&playlist=${sub.youtubeId}`}
                          title={sub.label}
                          allow="encrypted-media; picture-in-picture"
                          allowFullScreen
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 space-y-2">
            {Array.from({ length: exercise.workingSets }).map((_, idx) => (
              <SetForm
                key={`wk-${idx + 1}`}
                label={`Set ${idx + 1}`}
                onSave={(values) => logSet(exercise._id, "working", idx + 1, values)}
                saved={saved[`${exercise._id}-working-${idx + 1}`]}
                initialValues={drafts[`${exercise._id}-working-${idx + 1}`]}
              />
            ))}
          </div>
        </article>
      ));

  return (
    <section className="space-y-4">
      <p className="text-sm text-zinc-600">Date: {date}</p>
      {weekNumber ? (
        <p className="text-xs font-medium text-zinc-600">
          Week {weekNumber} {dayKey ? `· ${dayKey}` : ""}
        </p>
      ) : null}
      {message ? <p className="rounded-lg bg-zinc-100 p-2 text-sm">{message}</p> : null}
      {rendered}
    </section>
  );
}

function SetForm({
  label,
  saved,
  onSave,
  initialValues,
}: {
  label: string;
  saved?: boolean;
  onSave: (values: SetDraft) => Promise<void>;
  initialValues?: SetDraft;
}) {
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState(initialValues?.weight ?? "");
  const [reps, setReps] = useState(initialValues?.reps ?? "");
  const [lastSavedKey, setLastSavedKey] = useState(
    `${initialValues?.weight ?? ""}|${initialValues?.reps ?? ""}`
  );

  useEffect(() => {
    setWeight(initialValues?.weight ?? "");
    setReps(initialValues?.reps ?? "");
    setLastSavedKey(`${initialValues?.weight ?? ""}|${initialValues?.reps ?? ""}`);
  }, [initialValues?.weight, initialValues?.reps]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(async () => {
    const currentKey = `${weight}|${reps}`;
    if (!weight.trim() || currentKey === lastSavedKey) return;
    setSaving(true);
    try {
      await onSave({ weight, reps });
      setLastSavedKey(currentKey);
    } finally {
      setSaving(false);
    }
  }, [weight, reps, lastSavedKey, onSave]);

  // Long debounce as fallback — saves after user stops typing for 1.5s
  useEffect(() => {
    const currentKey = `${weight}|${reps}`;
    if (!weight.trim() || currentKey === lastSavedKey) return;

    timerRef.current = setTimeout(doSave, 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [weight, reps, lastSavedKey, doSave]);

  // Save immediately on blur
  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    doSave();
  };

  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-700">{label}</p>
        <span className="text-[11px] text-zinc-500">
          {saving ? "Saving..." : saved || `${weight}|${reps}` === lastSavedKey ? "Saved" : "Editing"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="rounded-lg border border-zinc-200 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-zinc-200"
          name="weight"
          required
          inputMode="decimal"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={handleBlur}
        />
        <input
          className="rounded-lg border border-zinc-200 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-zinc-200"
          name="reps"
          inputMode="numeric"
          placeholder="Reps (optional)"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
}
