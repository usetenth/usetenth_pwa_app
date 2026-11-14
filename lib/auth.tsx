"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { logout, signInWithTelegram } from "./api";
import { useSession } from "./session";
import { telegramWebApp } from "./telegram";

interface AuthValue {
  // False until we know whether Telegram already told us who this is.
  ready: boolean;
  signedIn: boolean;
  signOut: () => Promise<void>;
}

const Auth = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Inside Telegram the launch data is the sign-in; outside it, whatever session is stored stands.
    const done = () => !cancelled && setReady(true);
    if (telegramWebApp()) signInWithTelegram().catch(() => undefined).finally(done);
    else done();
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    await logout();
  }, []);

  const value = useMemo(() => ({ ready, signedIn: session !== null, signOut }), [ready, session, signOut]);
  return <Auth.Provider value={value}>{children}</Auth.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(Auth);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
