"use client";

import { useEffect, useState } from "react";
import { Field } from "@/components/ui";
import { fetchConfirmation, type ConfirmView, type Proof } from "@/lib/api";
import { BOT_URL } from "@/lib/config";
import { telegramWebApp } from "@/lib/telegram";

const POLL_MS = 2000;

function openBot() {
  const app = telegramWebApp();
  if (app?.openTelegramLink) app.openTelegramLink(BOT_URL);
  else window.open(BOT_URL, "_blank", "noopener");
}

/** Waits for the Approve tap in Telegram, which needs no copying between apps; the code stays as a fallback. */
function TelegramApproval({ challengeId, proof, onChange }: { challengeId: string | null; proof: Proof; onChange: (p: Proof) => void }) {
  const [live, setLive] = useState(true);
  const [useCode, setUseCode] = useState(false);
  const approved = !!proof.confirmation_id;

  useEffect(() => {
    if (!challengeId || approved) return;
    let stopped = false;
    const check = async () => {
      try {
        const s = await fetchConfirmation(challengeId);
        if (stopped) return;
        if (s.approved) onChange({ confirmation_id: challengeId });
        else if (!s.live) setLive(false);
      } catch {}
    };
    check();
    const timer = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, approved]);

  if (approved) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-gain/10 p-3.5 text-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gain/20 text-gain">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 13l4 4L19 7" /></svg>
        </span>
        <span className="font-medium">Approved in Telegram</span>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line p-3.5 text-sm">
        <p className="font-medium">{live ? "Approve it in Telegram" : "That request expired"}</p>
        <p className="mt-1 text-mute">
          {live ? "We sent you a message. Open the chat, tap Approve, then come back here. This page continues by itself." : "Go back and start the withdrawal again to get a new one."}
        </p>
        {live ? (
          <button type="button" onClick={openBot} className="mt-3 h-10 rounded-full bg-violet px-5 text-sm font-semibold text-white transition active:scale-95">Open Telegram</button>
        ) : null}
      </div>
      {live ? (
        useCode ? (
          <Field
            label="Or enter the confirmation code"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            spellCheck={false}
            value={proof.code ?? ""}
            onChange={(e) => onChange({ code: e.target.value })}
            hint="The same message has a code. It works once, for this action only."
          />
        ) : (
          <button type="button" onClick={() => setUseCode(true)} className="px-1 text-sm font-medium text-violet">Use the code instead</button>
        )
      ) : null}
    </div>
  );
}

/** Asks for whatever confirms this account: the password, or an approval from Telegram. */
export function ProofInput({ method, challengeId, proof, onChange }: { method: ConfirmView["method"]; challengeId: string | null; proof: Proof; onChange: (p: Proof) => void }) {
  return method === "password" ? (
    <Field
      label="Your password"
      type="password"
      autoComplete="current-password"
      value={proof.password ?? ""}
      onChange={(e) => onChange({ password: e.target.value })}
      hint="We ask every time money leaves your account."
    />
  ) : (
    <TelegramApproval challengeId={challengeId} proof={proof} onChange={onChange} />
  );
}

export const hasProof = (method: ConfirmView["method"], proof: Proof) =>
  method === "password" ? (proof.password ?? "") !== "" : !!proof.confirmation_id || (proof.code ?? "").trim().length >= 6;
