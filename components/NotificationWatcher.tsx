"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchNotifications, type NotificationView } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { arrivedSince } from "@/lib/notify";

const POLL_MS = 15_000;
const SHOW_MS = 6000;

declare global {
  interface Navigator {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

/** While the app is open: checks for new notices, shows a banner for each, and sets the app icon badge. */
export function NotificationWatcher() {
  const { signedIn } = useAuth();
  const router = useRouter();
  const seen = useRef<Set<string> | null>(null);
  const [banner, setBanner] = useState<NotificationView | null>(null);

  useEffect(() => {
    if (!signedIn) {
      seen.current = null;
      setBanner(null);
      navigator.clearAppBadge?.().catch(() => undefined);
      return;
    }
    let stopped = false;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const { unread, items } = await fetchNotifications();
        if (stopped) return;
        if (unread > 0) navigator.setAppBadge?.(unread).catch(() => undefined);
        else navigator.clearAppBadge?.().catch(() => undefined);
        // The first look only records what was already there, so old notices do not pop up on every launch.
        if (seen.current === null) {
          seen.current = new Set(items.map((n) => n.id));
          const fresh = arrivedSince(items, new Set());
          if (fresh.length > 0) show(fresh[fresh.length - 1]!);
          return;
        }
        const fresh = arrivedSince(items, seen.current);
        fresh.forEach((n) => seen.current!.add(n.id));
        if (fresh.length > 0) show(fresh[fresh.length - 1]!);
      } catch {}
    };
    const show = (n: NotificationView) => {
      setBanner(n);
      clearTimeout(hide);
      hide = setTimeout(() => setBanner(null), SHOW_MS);
    };
    check();
    const timer = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      clearTimeout(hide);
      document.removeEventListener("visibilitychange", check);
    };
  }, [signedIn]);

  if (!banner) return null;
  return (
    <button
      type="button"
      onClick={() => {
        setBanner(null);
        router.push("/notifications");
      }}
      className="banner-down fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto w-[calc(100%-1.5rem)] max-w-[406px] rounded-2xl border border-line bg-card p-4 text-left shadow-xl"
    >
      <span className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gain/15 text-gain">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{banner.title}</span>
          <span className="mt-0.5 block text-sm text-mute">{banner.body}</span>
        </span>
      </span>
    </button>
  );
}
