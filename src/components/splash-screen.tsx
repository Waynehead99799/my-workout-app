"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    // Only show splash in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (!isStandalone) {
      setVisible(false);
      return;
    }

    // Start exit animation after logo animation completes
    const timer = setTimeout(() => setAnimateOut(true), 1800);
    // Remove from DOM after fade out
    const remove = setTimeout(() => setVisible(false), 2400);
    return () => {
      clearTimeout(timer);
      clearTimeout(remove);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#111827] transition-opacity duration-500 ${
        animateOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex flex-col items-center ${
          animateOut ? "scale-110" : ""
        }`}
        style={{
          animation: animateOut
            ? "splash-zoom 500ms ease-out forwards"
            : "splash-in 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <svg
          width="96"
          height="96"
          viewBox="0 0 512 512"
          className="drop-shadow-2xl"
          style={{
            opacity: 0,
            animation: "splash-icon 600ms 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          <rect width="512" height="512" rx="112" fill="#111827" />
          <path
            d="M116 327h64l35-122 35 69 29-69 29 122h67l-50-198h-64l-23 56-23-56h-63z"
            fill="#ffffff"
          />
          <circle cx="256" cy="391" r="22" fill="#34d399" />
        </svg>

        {/* App name */}
        <h1
          className="mt-5 text-2xl font-semibold tracking-tight text-white"
          style={{
            opacity: 0,
            animation: "splash-text 600ms 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          Workout Tracker
        </h1>

        {/* Subtitle */}
        <p
          className="mt-1.5 text-sm text-zinc-400"
          style={{
            opacity: 0,
            animation: "splash-text 600ms 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          Track. Progress. Repeat.
        </p>
      </div>

      {/* Loading dots */}
      <div
        className="absolute bottom-16 flex gap-1.5"
        style={{
          opacity: 0,
          animation: "splash-text 400ms 1200ms ease-out forwards",
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>

      <style jsx>{`
        @keyframes splash-icon {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-10deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes splash-text {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes splash-in {
          0% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes splash-zoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
