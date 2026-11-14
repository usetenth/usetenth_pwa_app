"use client";

import { useEffect, useState } from "react";

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { user?: { first_name?: string } };
  ready: () => void;
  expand: () => void;
  openTelegramLink?: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const telegramWebApp = (): TelegramWebApp | null => {
  if (typeof window === "undefined") return null;
  const app = window.Telegram?.WebApp;
  return app?.initData ? app : null;
};

export const telegramFirstName = (): string | null => telegramWebApp()?.initDataUnsafe?.user?.first_name ?? null;

export function useInTelegram(): boolean {
  const [inTelegram, setInTelegram] = useState(false);
  useEffect(() => setInTelegram(telegramWebApp() !== null), []);
  return inTelegram;
}

/** Opens Telegram's own share picker, from inside Telegram or from a browser. */
export function shareViaTelegram(text: string, url: string) {
  const link = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const app = telegramWebApp();
  if (app?.openTelegramLink) app.openTelegramLink(link);
  else window.open(link, "_blank", "noopener");
}
