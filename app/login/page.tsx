"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppOnly } from "@/components/AppOnly";
import { Field, PrimaryButton, Screen, SecondaryButton } from "@/components/ui";
import { login, loginWithTelegramCode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useStandalone } from "@/lib/standalone";

function LoginScreen() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { ready, signedIn } = useAuth();
  const standalone = useStandalone();
  const [mode, setMode] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only same-site paths; anything else would let a crafted link bounce someone elsewhere.
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  useEffect(() => {
    if (ready && signedIn) router.replace(destination);
  }, [ready, signedIn, router, destination]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "email") await login(email.trim(), password);
      else await loginWithTelegramCode(code.trim());
      router.replace(destination);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const canSubmit = !busy && (mode === "email" ? email.includes("@") && password !== "" : code.trim().length >= 6);

  return (
    <Screen stack back={standalone ? false : "/"} brand title="Sign in" subtitle={mode === "email" ? "Welcome back." : "Use the code from the bot."}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === "email" ? (
          <>
            <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        ) : (
          <Field
            label="Code from Telegram"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            hint="Send /login to the usetenth bot and enter the code it gives you. It works once, for 5 minutes."
          />
        )}
        {error ? <p className="px-1 text-sm text-loss">{error}</p> : null}
        <PrimaryButton type="submit" disabled={!canSubmit}>{busy ? "Signing in…" : "Sign in"}</PrimaryButton>
        <SecondaryButton type="button" onClick={() => { setMode(mode === "email" ? "code" : "email"); setError(null); }}>
          {mode === "email" ? "Sign in with a Telegram code" : "Use email and password"}
        </SecondaryButton>
        <p className="text-center text-sm text-mute">
          New here? <Link href="/register" className="font-medium text-violet">Create an account</Link>
        </p>
      </form>
    </Screen>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AppOnly>
        <LoginScreen />
      </AppOnly>
    </Suspense>
  );
}
