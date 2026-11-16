"use client";

import { useEffect, useState } from "react";
import { SplashArt } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { releaseLaunch, useLaunchReleased } from "@/lib/launch";

const SEEN = "usetenth:launched";
const MIN_MS = 1500;
const FADE_MS = 350;
// If no screen ever reports in (an API outage, say), the splash still leaves.
const GIVE_UP_MS = 8000;

/** A native-style launch screen: shown once per app launch, whether or not the user is signed in. */
export function LaunchSplash() {
  const { ready } = useAuth();
  const [minDone, setMinDone] = useState(false);
  const [gone, setGone] = useState(false);
  const released = useLaunchReleased();

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
      sessionStorage.setItem(SEEN, "1");
    } catch {}
    if (seen) {
      setGone(true);
      return;
    }
    const t = setTimeout(() => setMinDone(true), MIN_MS);
    const giveUp = setTimeout(releaseLaunch, GIVE_UP_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(giveUp);
    };
  }, []);

  const leaving = ready && minDone && released;

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setGone(true), FADE_MS);
    return () => clearTimeout(t);
  }, [leaving]);

  if (gone) return null;
  return (
    <div
      aria-hidden={leaving}
      role="status"
      aria-label="Loading usetenth"
      className={`launch-splash fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg transition-opacity duration-300 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <SplashArt intro />
    </div>
  );
}
