"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cleanName } from "@/lib/mixes";

interface Option {
  asset_key: string;
  symbol: string;
  name: string;
}

function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** A searchable stock list: type to filter, arrow keys and Enter to choose. */
export function StockPicker({ stocks, value, onChange }: { stocks: Option[]; value: string; onChange: (assetKey: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  const chosen = stocks.find((s) => s.asset_key === value);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter((s) => cleanName(s.name).toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q));
  }, [stocks, query]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("touchstart", away);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(Math.max(0, stocks.findIndex((s) => s.asset_key === value)));
    search.current?.focus();
    // Only when it opens; later changes to the list or value must not reset typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (s: Option) => {
    onChange(s.asset_key);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[active]) choose(shown[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="mt-2 flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-line bg-card px-3 text-left"
      >
        <span className="min-w-0 truncate">
          {chosen ? (
            <>
              {cleanName(chosen.name)} <span className="num text-mute">{chosen.symbol}</span>
            </>
          ) : (
            <span className="text-mute">Choose a stock</span>
          )}
        </span>
        <Icon d="M7 15l5 5 5-5M7 9l5-5 5 5" className="h-4 w-4 shrink-0 text-mute" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-line bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Icon d="M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3" className="h-4 w-4 shrink-0 text-mute" />
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              placeholder="Search stocks"
              aria-label="Search stocks"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 w-full bg-transparent text-base outline-none placeholder:text-mute"
            />
          </div>
          <ul ref={list} id={id} role="listbox" className="max-h-64 overflow-y-auto p-1">
            {shown.length === 0 ? <li className="px-3 py-6 text-center text-sm text-mute">No stocks match.</li> : null}
            {shown.map((s, i) => (
              <li
                key={s.asset_key}
                role="option"
                aria-selected={s.asset_key === value}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(s)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${i === active ? "bg-chip" : ""}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="w-4 shrink-0 text-violet">{s.asset_key === value ? <Icon d="M5 13l4 4L19 7" /> : null}</span>
                  <span className="truncate">{cleanName(s.name)}</span>
                </span>
                <span className="num shrink-0 text-mute">{s.symbol}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
