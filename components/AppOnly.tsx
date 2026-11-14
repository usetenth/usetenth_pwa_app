"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { InstallSheet, useInstall } from "@/components/InstallButton";
import { PrimaryButton, Screen, SecondaryButton, Splash } from "@/components/ui";
import { ALLOW_BROWSER_AUTH, BOT_URL } from "@/lib/config";
import { authAllowed, isStandalone } from "@/lib/install";
import { telegramWebApp } from "@/lib/telegram";

/** Shows its children only in the installed app or Telegram; a plain browser tab is asked to install first. */
export function AppOnly({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(authAllowed({ standalone: isStandalone(), telegram: telegramWebApp() !== null, browserOverride: ALLOW_BROWSER_AUTH }));
  }, []);

  if (allowed === null) return <Splash />;
  return allowed ? <>{children}</> : <InstallGate />;
}

function InstallGate() {
  const { mode, install, help, closeHelp } = useInstall();
  return (
    <Screen
      back="/"
      brand
      title="Install usetenth to continue"
      subtitle="Create your account and sign in from the app, so you are always signed in the same place."
    >
      <PrimaryButton onClick={install}>Install the app</PrimaryButton>
      <InstallSheet open={help} mode={mode} onClose={closeHelp} />
      <SecondaryButton href={BOT_URL}>Open in Telegram instead</SecondaryButton>
      <p className="text-center text-sm text-mute">
        After installing, open usetenth from your home screen or app list. <Link href="/" className="font-medium text-violet">Back to start</Link>
      </p>
    </Screen>
  );
}
