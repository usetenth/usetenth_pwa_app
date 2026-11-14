"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ErrorScreen, OFFLINE_COPY } from "@/components/ErrorScreen";
import { Splash } from "@/components/ui";
import { fetchStage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isUnreachable } from "@/lib/http";
import { useLoad } from "@/lib/hooks";
import { routeFor } from "@/lib/stage";

/** Signed-in users only; everyone else goes to the sign-in screen and comes back here after. */
export function Guard({ children }: { children: ReactNode }) {
  const { ready, signedIn } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (ready && !signedIn) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ready, signedIn, router, path]);

  return ready && signedIn ? <>{children}</> : <Splash />;
}

/** Signed in and fully set up; anyone earlier in setup is sent to their next step. */
export function RequireActive({ children }: { children: ReactNode }) {
  return (
    <Guard>
      <ActiveOnly>{children}</ActiveOnly>
    </Guard>
  );
}

function ActiveOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: stage, error } = useLoad(fetchStage);

  useEffect(() => {
    if (stage && stage !== "active") router.replace(routeFor(stage));
  }, [stage, router]);

  if (error) {
    return isUnreachable(error) ? (
      <ErrorScreen kind="offline" {...OFFLINE_COPY} retry />
    ) : (
      <ErrorScreen kind="error" title="Something went wrong" message="We could not load your account. Please try again." retry />
    );
  }
  return stage === "active" ? <>{children}</> : <Splash />;
}
