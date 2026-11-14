"use client";

import { useRouter } from "next/navigation";
import { DotRing, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useReleaseLaunch } from "@/lib/launch";

export type ErrorKind = "offline" | "error" | "notfound";

const BADGES = {
  offline: "M2 8.8a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01M3 3l18 18",
  error: "M12 7v6M12 17h.01",
} as const;

/** The brand dot ring, faded, with a small badge for what went wrong. */
export function StatusArt({ kind, className = "h-28 w-28" }: { kind: ErrorKind; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <DotRing percent={10} className={`h-full w-full ${kind === "notfound" ? "opacity-30" : "opacity-40"}`} />
      {kind === "notfound" ? (
        <span className="num absolute inset-0 flex items-center justify-center text-2xl font-semibold tracking-tight">404</span>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet text-white shadow-[0_8px_24px_-8px_rgba(91,61,245,0.8)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={BADGES[kind]} />
            </svg>
          </span>
        </span>
      )}
    </div>
  );
}

interface Props {
  kind: ErrorKind;
  title: string;
  message: string;
  onRetry?: () => void;
  retry?: boolean;
  home?: boolean;
  back?: boolean;
}

/** A full-screen state for when something is missing or broken. */
export function ErrorScreen({ kind, title, message, onRetry, retry = false, home = false, back = false }: Props) {
  useReleaseLaunch();
  const router = useRouter();
  const doRetry = onRetry ?? (() => window.location.reload());
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center gap-6 px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-center">
      <StatusArt kind={kind} />
      <div>
        <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        <p className="mt-2 text-mute">{message}</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        {retry ? <PrimaryButton onClick={doRetry}>Try again</PrimaryButton> : null}
        {home ? (retry ? <SecondaryButton href="/">Go to start</SecondaryButton> : <PrimaryButton href="/">Go to start</PrimaryButton>) : null}
        {back ? <SecondaryButton onClick={() => router.back()}>Go back</SecondaryButton> : null}
      </div>
    </div>
  );
}

export const OFFLINE_COPY = {
  title: "Can't reach usetenth",
  message: "Check your connection and try again. If it keeps happening, we are probably fixing something and will be back shortly.",
};
