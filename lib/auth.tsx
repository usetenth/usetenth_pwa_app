"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { logout, signInWithTelegram } from "./api";
import { useSession } from "./session";
import { telegramWebApp } from "./telegram";

interface AuthValue {
  // False until we know whether Telegram already told us who this is.
  ready: boolean;
  signedIn: boolean;
  // Why signing in from Telegram's launch data failed, so the app can say so instead of showing a sign-in form.
  signInError: string | null;
  retrySignIn: () => void;
  signOut: () => Promise<void>;
}

const Auth = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const [ready, setReady] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Inside Telegram the launch data is the sign-in; outside it, whatever session is stored stands.
    const done = () => !cancelled && setReady(true);
    if (telegramWebApp()) {
      setSignInError(null);
      signInWithTelegram()
        .catch((e: Error) => !cancelled && setSignInError(e.message))
        .finally(done);
    } else done();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retrySignIn = useCallback(() => {
    setReady(false);
    setAttempt((n) => n + 1);
  }, []);

  const signOut = useCallback(async () => {
    await logout();
  }, []);

  const value = useMemo(() => ({ ready, signedIn: session !== null, signOut, signInError, retrySignIn }), [ready, session, signOut, signInError, retrySignIn]);
  return <Auth.Provider value={value}>{children}</Auth.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(Auth);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
