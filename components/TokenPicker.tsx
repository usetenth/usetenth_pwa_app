"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/WalletShare";
import { chainName } from "@/lib/networks";
import { fromCents, toCents, usd } from "@/lib/money";
import type { WithdrawAsset } from "@/lib/api";

export interface TokenOption extends WithdrawAsset {
  // Why this one cannot be chosen right now.
  blocked?: string;
}

const where = (a: WithdrawAsset) => (a.chain ? chainName(a.chain, a.chain_family === "solana" ? "solana" : "evm") : "Exchange balance");
const amount = (a: WithdrawAsset) => (a.available != null ? usd(fromCents(toCents(a.available))) : "Balance unknown");

/** A drop-down of every token the user holds, each with its exact balance. */
export function TokenPicker({ options, value, onChange }: { options: TokenOption[]; value: string; onChange: (assetKey: string) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const chosen = options.find((o) => o.asset_key === value);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("touchstart", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 text-left"
      >
        {chosen ? (
          <span className="min-w-0">
            <span className="block truncate font-medium">{chosen.symbol} <span className="font-normal text-mute">· {where(chosen)}</span></span>
            <span className="num block text-xs text-mute">{amount(chosen)} available</span>
          </span>
        ) : (
          <span className="text-mute">{options.length === 0 ? "No stablecoin balance" : "Choose a token"}</span>
        )}
        <Icon d="M7 15l5 5 5-5M7 9l5-5 5 5" className="h-4 w-4 shrink-0 text-mute" />
      </button>

      {open ? (
        <ul id={id} role="listbox" className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-line bg-card p-1 shadow-lg">
          {options.length === 0 ? <li className="px-3 py-6 text-center text-sm text-mute">You hold no stablecoins right now.</li> : null}
          {options.map((o) => (
            <li
              key={o.asset_key}
              role="option"
              aria-selected={o.asset_key === value}
              aria-disabled={!!o.blocked}
              onClick={() => {
                if (o.blocked) return;
                onChange(o.asset_key);
                setOpen(false);
              }}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${o.blocked ? "cursor-not-allowed opacity-50" : "cursor-pointer active:bg-chip"} ${o.asset_key === value ? "bg-chip" : ""}`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 text-violet">{o.asset_key === value ? <Icon d="M5 13l4 4L19 7" className="h-4 w-4" /> : null}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{o.symbol} <span className="font-normal text-mute">· {where(o)}</span></span>
                  {o.blocked ? <span className="block text-xs text-mute">{o.blocked}</span> : null}
                </span>
              </span>
              <span className="num shrink-0">{amount(o)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
