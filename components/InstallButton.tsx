"use client";

import { useEffect, useState, type ReactNode } from "react";
import { type InstallMode, installMode, isIos, isStandalone } from "@/lib/install";

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Browsers fire this once, often before React mounts, so it is captured at module load.
let saved: PromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    saved = e as PromptEvent;
  });
}

export function useInstall() {
  const [mode, setMode] = useState<InstallMode>("manual");
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const refresh = () => setMode(installMode({ standalone: isStandalone(), ios: isIos(navigator.userAgent, navigator.maxTouchPoints), hasPrompt: saved !== null }));
    refresh();
    const onPrompt = (e: Event) => {
      e.preventDefault();
      saved = e as PromptEvent;
      refresh();
    };
    const onInstalled = () => {
      saved = null;
      setMode("installed");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!saved) {
      setHelp(true);
      return;
    }
    const prompt = saved;
    saved = null;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setMode(outcome === "accepted" ? "installed" : "manual");
  };

  return { mode, install, help, closeHelp: () => setHelp(false) };
}

function ShareGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v12M8 7l4-4 4 4" />
    </svg>
  );
}

function Step({ n, title, hint, glyph }: { n: number; title: string; hint: string; glyph: ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5">
      <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet text-sm font-semibold text-white">{n}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="block text-sm text-mute">{hint}</span>
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chip text-violet">{glyph}</span>
    </li>
  );
}

/** A pop-up with the steps for devices that cannot install the app with one tap, such as iPhones. */
export function InstallSheet({ open, mode, onClose }: { open: boolean; mode: InstallMode; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const ios = mode === "ios";
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Install usetenth">
      <button type="button" aria-label="Close" onClick={onClose} className="sheet-fade absolute inset-0 bg-black/50" />
      <div className="sheet-up relative w-full max-w-[430px] rounded-t-3xl border border-line bg-bg px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <h2 className="text-xl font-semibold">Install usetenth</h2>
        <p className="mt-1 text-sm text-mute">{ios ? "On iPhone it takes three taps in Safari." : "Your browser installs it from its menu."}</p>

        <ol className="mt-4 space-y-2.5">
          {ios ? (
            <>
              <Step n={1} title="Tap the Share button" hint="At the bottom of Safari" glyph={<ShareGlyph />} />
              <Step n={2} title="Choose Add to Home Screen" hint="Scroll down the list if you do not see it" glyph={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1zM12 8v8M8 12h8" /></svg>} />
              <Step n={3} title="Tap Add" hint="Then open usetenth from your home screen" glyph={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 13l4 4L19 7" /></svg>} />
            </>
          ) : (
            <>
              <Step n={1} title="Open your browser menu" hint="The three dots, or the address bar" glyph={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>} />
              <Step n={2} title="Choose Install app" hint="Or Add to Home screen" glyph={<ShareGlyph />} />
              <Step n={3} title="Open usetenth from your apps" hint="It opens full screen, like any app" glyph={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 13l4 4L19 7" /></svg>} />
            </>
          )}
        </ol>

        {ios ? <p className="mt-4 rounded-2xl bg-chip p-3 text-sm text-mute">Seeing this inside Telegram or another app? Open the link in Safari first. Only Safari can add it to your home screen.</p> : null}

        <button type="button" onClick={onClose} className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-violet font-semibold text-white shadow-[0_8px_24px_-8px_rgba(91,61,245,0.7)] transition active:scale-[0.99]">
          Got it
        </button>
        {ios ? (
          <div className="mt-3 flex flex-col items-center text-xs text-mute" aria-hidden>
            <span>The Share button is down here</span>
            <svg viewBox="0 0 24 24" className="bounce-down mt-1 h-5 w-5 text-violet" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          </div>
        ) : null}
      </div>
    </div>
  );
}
