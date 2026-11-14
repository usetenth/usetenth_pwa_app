"use client";

import { useSyncExternalStore } from "react";

export interface Session {
  access: string;
  refresh: string;
  // Which door they came in by; inside Telegram the Telegram identity always wins.
  via: "email" | "telegram";
}

const KEY = "usetenth:session";
const listeners = new Set<() => void>();
let cache: Session | null | undefined;

function read(): Session | null {
  if (cache !== undefined) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: Session | null) {
  cache = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

export const getSession = (): Session | null => (typeof window === "undefined" ? null : read());
export const setSession = (session: Session) => write(session);
export const clearSession = () => write(null);

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

/** Tests only. */
export const resetSessionCache = () => {
  cache = undefined;
};
