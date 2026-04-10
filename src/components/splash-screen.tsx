"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  // Start visible — hide later if not PWA. This prevents white flash.
  const [state, setState] = useState<"show" | "exit" | "done">("show");

  useEffect(() => {
    // Detect PWA standalone mode
    let isStandalone = false;

    // iOS
    if ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) {
      isStandalone = true;
    }

    // Android / desktop
    try {
      if (window.matchMedia("(display-mode: standalone)").matches) isStandalone = true;
      if (window.matchMedia("(display-mode: fullscreen)").matches) isStandalone = true;
    } catch {}

    // iOS fallback
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS && window.innerHeight >= screen.height - 40) isStandalone = true;

    // Android TWA
    if (document.referrer.includes("android-app://")) isStandalone = true;

    if (!isStandalone) {
      // Not a PWA — hide immediately without animation
      setState("done");
      return;
    }

    // Already shown this session
    if (sessionStorage.getItem("splash-shown")) {
      setState("done");
      return;
    }
    sessionStorage.setItem("splash-shown", "1");

    // Run the animation sequence
    const exitTimer = setTimeout(() => setState("exit"), 2000);
    const doneTimer = setTimeout(() => setState("done"), 2600);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (state === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#111827",
        animation: state === "exit" ? "splash-exit 600ms ease-in forwards" : undefined,
        // Prevent scroll while splash is visible
        touchAction: "none",
      }}
    >
      {/* Dumbbell Logo */}
      <div
        style={{
          opacity: 0,
          animation: "splash-icon 800ms 100ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <svg width="100" height="100" viewBox="0 0 512 512" fill="none">
          <circle cx="256" cy="256" r="256" fill="#111827" />
          <rect x="128" y="244" width="256" height="24" rx="12" fill="#6366f1" />
          <rect x="100" y="192" width="40" height="128" rx="10" fill="#e0e7ff" />
          <rect x="72" y="210" width="32" height="92" rx="8" fill="#a5b4fc" />
          <rect x="372" y="192" width="40" height="128" rx="10" fill="#e0e7ff" />
          <rect x="408" y="210" width="32" height="92" rx="8" fill="#a5b4fc" />
          <rect x="232" y="250" width="12" height="12" rx="2" fill="#312e81" />
          <rect x="250" y="250" width="12" height="12" rx="2" fill="#312e81" />
          <rect x="268" y="250" width="12" height="12" rx="2" fill="#312e81" />
        </svg>
      </div>

      {/* App name */}
      <h1
        style={{
          marginTop: 24,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          opacity: 0,
          animation: "splash-text 600ms 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        Workout Tracker
      </h1>

      {/* Accent bar */}
      <div
        style={{
          marginTop: 12,
          width: 48,
          height: 4,
          borderRadius: 2,
          background: "linear-gradient(90deg, #6366f1, #34d399)",
          transformOrigin: "left",
          transform: "scaleX(0)",
          animation: "splash-bar 600ms 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      />

      {/* Subtitle */}
      <p
        style={{
          marginTop: 12,
          fontSize: 14,
          color: "#9ca3af",
          fontFamily: "system-ui, -apple-system, sans-serif",
          opacity: 0,
          animation: "splash-text 600ms 1000ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        Track. Progress. Repeat.
      </p>

      {/* Loading dots */}
      <div
        style={{
          position: "absolute",
          bottom: 64,
          display: "flex",
          gap: 8,
          opacity: 0,
          animation: "splash-text 400ms 1300ms ease-out forwards",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#6366f1",
              animation: `splash-pulse 1.2s ${i * 0.15}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
