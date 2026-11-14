"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireActive } from "@/components/Guard";
import { Card, ErrorCard, PrimaryButton, Screen } from "@/components/ui";
import { fetchAssets, fetchCustomPicks, fetchPlans, fetchRule, saveCustomPicks, saveRule, type PlanId } from "@/lib/api";
import { useLoad } from "@/lib/hooks";
import { cleanName, equalWeights, summarize } from "@/lib/mixes";

function Mix() {
  const router = useRouter();
  const rule = useLoad(fetchRule);
  const plans = useLoad(fetchPlans);
  const assets = useLoad(fetchAssets);
  const saved = useLoad(fetchCustomPicks);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saved.data && picked === null) setPicked(saved.data.map((s) => s.asset_key));
  }, [saved.data, picked]);

  const percent = rule.data?.percentage ?? 10;
  const current = rule.data?.plan;
  const chosen = useMemo(() => new Set(picked ?? []), [picked]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (assets.data ?? [])
      .filter((a) => !q || a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      .sort((a, b) => cleanName(a.name).localeCompare(cleanName(b.name)));
  }, [assets.data, query]);

  const choosePreset = async (plan: PlanId) => {
    setBusy(true);
    setError(null);
    try {
      await saveRule(percent, plan);
      router.push("/tenth");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const useMine = async () => {
    const keys = picked ?? [];
    const weights = equalWeights(keys.length);
    setBusy(true);
    setError(null);
    try {
      await saveCustomPicks(keys.map((asset_key, i) => ({ asset_key, weight_bps: weights[i]! })));
      await saveRule(percent, "custom");
      router.push("/tenth");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const toggle = (key: string) =>
    setPicked((prev) => ((prev ?? []).includes(key) ? (prev ?? []).filter((k) => k !== key) : [...(prev ?? []), key]));

  return (
    <Screen
      back="/tenth"
      title="Your mix"
      footer={picked && picked.length > 0 ? <PrimaryButton onClick={useMine} disabled={busy}>{busy ? "Saving…" : `Use my ${picked.length} pick${picked.length === 1 ? "" : "s"}`}</PrimaryButton> : undefined}
    >
      {error ? <ErrorCard title="Could not save your mix.">{error}</ErrorCard> : null}

      <div className="flex flex-col gap-3">
        {(plans.data ?? []).map((m) => {
          const on = current === m.plan;
          return (
            <button
              key={m.plan}
              onClick={() => choosePreset(m.plan)}
              disabled={busy || m.stocks.length === 0}
              aria-pressed={on}
              className={`rounded-2xl border p-4 text-left transition disabled:opacity-50 ${on ? "border-violet bg-violet/10" : "border-line bg-card/90"}`}
            >
              <span className="block font-medium">{m.name}</span>
              <span className="block text-sm text-mute">{m.blurb}</span>
              <span className="mt-1 block text-xs text-mute">{summarize(m.stocks)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        <h2 className="px-1 text-[15px] font-medium">Or pick your own</h2>
        <p className="mb-3 px-1 text-sm text-mute">Every stock here can be bought right now. Your money is split evenly across the ones you pick.</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or ticker"
          className="mb-3 h-12 w-full rounded-2xl border border-line bg-card px-4 outline-none"
        />
        {assets.error ? (
          <ErrorCard title="Couldn't load the stock list.">{assets.error}</ErrorCard>
        ) : !assets.data ? (
          <p className="px-1 text-sm text-mute">Loading available stocks…</p>
        ) : visible.length === 0 ? (
          <p className="px-1 text-sm text-mute">No stocks match &ldquo;{query}&rdquo;.</p>
        ) : (
          <Card className="divide-y divide-line p-0">
            {visible.map((a) => {
              const on = chosen.has(a.asset_key);
              return (
                <button key={a.asset_key} onClick={() => toggle(a.asset_key)} aria-pressed={on} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-violet bg-violet text-white" : "border-mute/60"}`}>{on ? "✓" : ""}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{cleanName(a.name)}</span>
                    <span className="num block text-xs text-mute">{a.symbol}</span>
                  </span>
                </button>
              );
            })}
          </Card>
        )}
      </div>
    </Screen>
  );
}

export default function MixPage() {
  return (
    <RequireActive>
      <Mix />
    </RequireActive>
  );
}
