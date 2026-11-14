"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppOnly } from "@/components/AppOnly";
import { Field, PrimaryButton, Screen } from "@/components/ui";
import { register } from "@/lib/api";
import { useStandalone } from "@/lib/standalone";

const MIN_PASSWORD = 10;

function RegisterScreen() {
  const router = useRouter();
  const standalone = useStandalone();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const short = password !== "" && password.length < MIN_PASSWORD;
  const canSubmit = email.includes("@") && password.length >= MIN_PASSWORD && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(email.trim(), password);
      router.replace("/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Screen stack back={standalone ? "/login" : "/"} brand title="Create your account" subtitle="Email and password. Add Telegram later if you like.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={short ? `Use at least ${MIN_PASSWORD} characters.` : null}
          hint={`At least ${MIN_PASSWORD} characters.`}
        />
        {error ? <p className="px-1 text-sm text-loss">{error}</p> : null}
        <PrimaryButton type="submit" disabled={!canSubmit}>{busy ? "Creating…" : "Create account"}</PrimaryButton>
        <p className="px-1 text-center text-xs text-mute">
          By creating an account you agree to the <Link href="/terms" className="font-medium text-ink underline underline-offset-2">terms and privacy policy</Link>.
        </p>
        <p className="text-center text-sm text-mute">
          Already have one? <Link href="/login" className="font-medium text-violet">Sign in</Link>
        </p>
      </form>
    </Screen>
  );
}

export default function RegisterPage() {
  return (
    <AppOnly>
      <RegisterScreen />
    </AppOnly>
  );
}
