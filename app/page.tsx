"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Landing } from "@/components/Landing";
import { Splash } from "@/components/ui";
import { fetchStage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { readWithdrawDraft } from "@/lib/draft";
import { routeFor } from "@/lib/stage";
import { useStandalone } from "@/lib/standalone";

export default function HomePage() {
  const router = useRouter();
  const { ready, signedIn } = useAuth();
  const standalone = useStandalone();

  // The installed app never shows the landing page: it goes straight to sign-in.
  useEffect(() => {
    if (ready && standalone && !signedIn) router.replace("/login");
  }, [ready, standalone, signedIn, router]);

  useEffect(() => {
    if (!ready || !signedIn) return;
    // A stage we cannot read (API down) falls back to the portfolio, which shows the error itself.
    // A withdrawal waiting for approval in Telegram picks up where it left off when the app is reopened.
    if (readWithdrawDraft()) return router.replace("/withdraw");
    fetchStage().then((s) => router.replace(routeFor(s))).catch(() => router.replace("/portfolio"));
  }, [ready, signedIn, router]);

  if (!ready || standalone === null) return <Splash />;
  return signedIn || standalone ? <Splash /> : <Landing />;
}
