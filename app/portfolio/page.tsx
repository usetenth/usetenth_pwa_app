"use client";

import Link from "next/link";
import { RequireActive } from "@/components/Guard";
import { BellLink, Card, ErrorCard, NavTile, PrimaryButton, Screen, SecondaryButton, ThemeToggle } from "@/components/ui";
import { fetchHoldings, fetchMe, fetchNotifications, fetchPending, fetchPortfolio, fetchRule } from "@/lib/api";
import { SAMPLE_PAYMENT } from "@/lib/config";
import { useLoad } from "@/lib/hooks";
import { cleanName, PERCENTS } from "@/lib/mixes";
import { isNegative, percentOf, signedUsd, usd } from "@/lib/money";
import { pendingLines, proceedsComing, sellState } from "@/lib/pending";
import { telegramFirstName } from "@/lib/telegram";

function Portfolio() {
  const portfolio = useLoad(fetchPortfolio, null, true, 10_000);
  const holdings = useLoad(fetchHoldings, null, true, 10_000);
  const rule = useLoad(fetchRule);
  const me = useLoad(fetchMe);
  const notices = useLoad(fetchNotifications, null, true, 15_000);
  const pending = useLoad(fetchPending, null, true, 5_000);
  const lines = pendingLines(pending.data, new Set((holdings.data ?? []).map((h) => h.asset_key)));
  const selling = sellState(pending.data);
  const coming = proceedsComing(pending.data);

  const percent = rule.data?.percentage ?? 10;
  const nextPercent = PERCENTS.find((p) => p > percent);
  const name = telegramFirstName() ?? me.data?.email?.split("@")[0] ?? null;
  const p = portfolio.data;

  return (
    <Screen
      brand
      title="Portfolio"
      subtitle={name ? `Hi, ${name}` : undefined}
      right={
        <div className="flex items-center gap-2">
          <BellLink unread={notices.data?.unread ?? 0} />
          <ThemeToggle />
        </div>
      }
      footer={
        <div className="flex gap-3">
          <PrimaryButton href="/withdraw" className="flex-[1.4]">Withdraw</PrimaryButton>
          <SecondaryButton href="/add-funds" className="flex-1">Add funds</SecondaryButton>
        </div>
      }
    >
      <nav className="grid grid-cols-4 gap-2">
        <NavTile href="/tenth" icon="tenth" label="Your tenth" />
        <NavTile href="/activity" icon="activity" label="Activity" />
        <NavTile href="/buy" icon="buy" label="Buy" />
        <NavTile href="/account" icon="account" label="Account" />
      </nav>

      {portfolio.error ? (
        <ErrorCard title="Couldn't load your portfolio.">{portfolio.error}</ErrorCard>
      ) : !p ? (
        <p className="px-1 pt-2 text-sm text-mute">Loading your portfolio…</p>
      ) : (
        <>
          <div className="px-1 pt-2">
            <p className="text-sm text-mute">Worth today</p>
            <p className="num text-5xl font-semibold tracking-tight">{usd(p.value)}</p>
            {p.gain !== null ? (
              <p className={`num mt-1 text-sm ${isNegative(p.gain) ? "text-loss" : "text-gain"}`}>
                {isNegative(p.gain) ? "↓" : "↑"} {signedUsd(p.gain)} since you started
              </p>
            ) : (
              <p className="mt-1 text-sm text-mute">{p.holdings.length === 0 ? "Nothing invested yet." : "Waiting for your purchases to settle."}</p>
            )}
          </div>

          <Card className="flex justify-between">
            <div>
              <p className="text-sm text-mute">Invested so far</p>
              <p className="num text-2xl">{usd(p.invested)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-mute">Ready to withdraw</p>
              <p className="num text-2xl">{usd(p.cash)}</p>
              {coming !== "0.00" ? <p className="num text-xs text-mute">+ {usd(coming)} from sales</p> : null}
            </div>
          </Card>
        </>
      )}

      {lines.length > 0 ? (
        <div>
          <h2 className="mb-2 px-1 text-sm text-mute">In progress</h2>
          <Card className="divide-y divide-line p-0">
            {lines.map((l) => (
              <div key={l.key} className="flex items-start gap-3 px-4 py-3">
                <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-violet" />
                <div className="min-w-0">
                  <p className="font-medium">{l.title}</p>
                  <p className="text-sm text-mute">{l.detail}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 px-1 text-sm text-mute">Holdings</h2>
        {holdings.error ? (
          <ErrorCard title="Couldn't load your holdings.">{holdings.error}</ErrorCard>
        ) : holdings.data && holdings.data.length === 0 ? (
          <Card>
            <p className="text-sm text-mute">Your first payment will show up here, split across your mix.</p>
          </Card>
        ) : holdings.data ? (
          <Card className="divide-y divide-line p-0">
            {holdings.data.map((h) => (
              <div key={h.asset_key} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{cleanName(h.name)}</p>
                  <p className="num truncate text-sm text-mute">{shortQty(h.available)} {h.symbol}</p>
                </div>
                <p className="num shrink-0">{h.value_usd !== null ? usd(h.value_usd) : "-"}</p>
                {selling.has(h.asset_key) ? (
                  <span className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm text-mute">{selling.get(h.asset_key) === "selling" ? "Selling…" : "Updating…"}</span>
                ) : (
                  <Link href={`/sell?asset=${encodeURIComponent(h.asset_key)}`} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-violet">Sell</Link>
                )}
              </div>
            ))}
          </Card>
        ) : null}
      </div>

      {nextPercent ? (
        <section className="rounded-2xl bg-lime p-4 text-[#12131a]">
          <p className="font-semibold">Raise your tenth?</p>
          <p className="mt-1 text-sm">
            At {nextPercent}%, a {usd(SAMPLE_PAYMENT)} payment would invest {usd(percentOf(SAMPLE_PAYMENT, nextPercent))} instead of {usd(percentOf(SAMPLE_PAYMENT, percent))}.
          </p>
          <Link href="/tenth" className="mt-3 inline-block font-semibold text-violet underline underline-offset-2">Raise my tenth</Link>
        </section>
      ) : null}
    </Screen>
  );
}

function shortQty(q: string) {
  const n = Number(q);
  return Number.isFinite(n) ? String(Number(n.toFixed(6))) : q;
}

export default function PortfolioPage() {
  return (
    <RequireActive>
      <Portfolio />
    </RequireActive>
  );
}
