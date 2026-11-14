"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BOT_URL } from "@/lib/config";
import { copyText } from "@/lib/clipboard";
import { shareMessage, shortAddress } from "@/lib/share";
import { shareViaTelegram } from "@/lib/telegram";

export function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const ICONS = {
  copy: "M9 9h11v11H9zM5 15V5a1 1 0 011-1h10",
  check: "M5 13l4 4L19 7",
  telegram: "M21 3L3 11l7 3 3 7 8-18zM10 14l11-11",
  share: "M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v12M8 7l4-4 4 4",
  text: "M5 5h14M5 10h14M5 15h9",
} as const;

/** A scannable code for the address, always dark on white so any camera can read it. */
export function AddressQr({ value, size = 200, className = "" }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let stale = false;
    import("qrcode")
      .then((q) => q.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M", color: { dark: "#12131a", light: "#ffffff" } }))
      .then((url) => !stale && setSrc(url))
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [value, size]);
  return (
    <div className={`flex items-center justify-center rounded-2xl bg-white p-3 ${className}`} style={{ width: size + 24, height: size + 24 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="QR code of your wallet address" width={size} height={size} /> : <span className="h-6 w-6 animate-pulse rounded-full bg-violet/30" />}
    </div>
  );
}

function ActionRow({ icon, title, hint, done, onClick }: { icon: keyof typeof ICONS; title: string; hint: string; done?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-chip">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-gain/15 text-gain" : "bg-violet/10 text-violet"}`}>
        <Icon d={done ? ICONS.check : ICONS[icon]} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{done ? "Copied" : title}</span>
        <span className="block truncate text-sm text-mute">{hint}</span>
      </span>
    </button>
  );
}

export function ShareSheet({ open, onClose, asset, network, address }: { open: boolean; onClose: () => void; asset: string; network: string; address: string }): ReactNode {
  const [copied, setCopied] = useState<"address" | "details" | null>(null);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const message = shareMessage(asset, network, address);

  useEffect(() => {
    if (!open) return;
    setCopied(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const copy = async (what: "address" | "details") => {
    if (await copyText(what === "address" ? address : message)) {
      setCopied(what);
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 2000);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Share your wallet">
      <button type="button" aria-label="Close" onClick={onClose} className="sheet-fade absolute inset-0 bg-black/50" />
      <div className="sheet-up relative w-full max-w-[430px] rounded-t-3xl border border-line bg-bg px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <h2 className="text-xl font-semibold">Share your wallet</h2>
        <p className="mt-1 text-sm text-mute">Send this to whoever is paying you.</p>

        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-card p-3">
          <AddressQr value={address} size={72} />
          <div className="min-w-0">
            <p className="inline-block rounded-full bg-violet/10 px-3 py-1 text-xs font-medium text-violet">{asset} on {network}</p>
            <p className="num mt-2 truncate text-sm">{shortAddress(address)}</p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          <ActionRow icon="copy" title="Copy address" hint="Just the address" done={copied === "address"} onClick={() => copy("address")} />
          <ActionRow icon="text" title="Copy payment details" hint="Address, network and a safety note" done={copied === "details"} onClick={() => copy("details")} />
          <ActionRow icon="telegram" title="Share on Telegram" hint="Send it to a chat or contact" onClick={() => shareViaTelegram(message, BOT_URL)} />
          {canShare ? (
            <ActionRow icon="share" title="More ways to share" hint="Messages, email and other apps" onClick={() => navigator.share({ title: "My usetenth wallet", text: message }).catch(() => undefined)} />
          ) : null}
        </div>

        <button type="button" onClick={onClose} className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-line bg-card font-semibold transition active:scale-[0.99]">
          Done
        </button>
      </div>
    </div>
  );
}
