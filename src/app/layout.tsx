import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { AppSessionProvider } from "@/components/session-provider";
import { MobileNav } from "@/components/mobile-nav";
import { PwaRegister } from "@/components/pwa-register";
import { SplashScreen } from "@/components/splash-screen";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "Bodybuilding progress tracker with cycles and calendar",
  manifest: "/manifest.webmanifest",
  applicationName: "Workout Tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Workout Tracker",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=navigator.standalone||(window.matchMedia&&window.matchMedia("(display-mode:standalone)").matches);if(s)document.documentElement.style.background="#111827"}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full bg-zinc-50 text-zinc-900">
        <AppSessionProvider>
          <SplashScreen />
          <PwaRegister />
          <div className="mx-auto min-h-screen w-full max-w-4xl pb-20 md:pb-6">{children}</div>
          <MobileNav />
        </AppSessionProvider>
      </body>
    </html>
  );
}
