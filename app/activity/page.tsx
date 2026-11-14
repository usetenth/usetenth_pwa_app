"use client";

import { RequireActive } from "@/components/Guard";
import { Card, ErrorCard, Screen } from "@/components/ui";
import { fetchInvestments, fetchOrders, fetchWithdrawals, type OrderStatus } from "@/lib/api";
import { useLoad } from "@/lib/hooks";
import { usd } from "@/lib/money";

const STATUS: Record<OrderStatus | "skipped" | "partial", string> = {
  in_progress: "In progress",
  completed: "Done",
  failed: "Failed",
  simulated: "Simulated",
  skipped: "Not invested",
  partial: "Partly done",
};

const SKIPPED: Record<string, string> = {
  before_activation: "It arrived before your tenth was switched on.",
  rule_disabled: "Your tenth is not switched on yet.",
  rule_expired: "Your tenth has expired.",
  allocation_unavailable: "Your mix could not be bought right now.",
  below_minimum: "Your tenth of it was too small to invest.",
  daily_limit: "You reached today's investing limit.",
  zero_percentage: "Your tenth is set to zero.",
};

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
const tone = (s: string) => (s === "failed" ? "text-loss" : s === "completed" ? "text-gain" : "text-mute");

function Activity() {
  const investments = useLoad(fetchInvestments);
  const orders = useLoad(fetchOrders);
  const withdrawals = useLoad(fetchWithdrawals);
  const manual = (orders.data ?? []).filter((o) => o.kind === "manual");

  return (
    <Screen back="/portfolio" title="Activity">
      {investments.error ? <ErrorCard>{investments.error}</ErrorCard> : null}

      <div>
        <h2 className="mb-2 px-1 text-sm text-mute">Payments invested</h2>
        {investments.data && investments.data.length === 0 ? (
          <Card><p className="text-sm text-mute">Nothing yet. Your first payment will show up here.</p></Card>
        ) : (
          <Card className="divide-y divide-line p-0">
            {(investments.data ?? []).map((i) => (
              <div key={i.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{usd(i.deposit_usd)} payment</p>
                  <p className={`text-sm ${tone(i.status)}`}>{STATUS[i.status]}</p>
                </div>
                <p className="num text-sm text-mute">{day(i.created_at)} · {i.percentage}%</p>
                {i.status === "skipped" ? (
                  <p className="mt-1 text-sm text-mute">{SKIPPED[i.reason ?? ""] ?? "It was not invested."}</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className="flex justify-between"><span className="text-mute">Invested</span><span className="num">{usd(i.invested_usd)}</span></li>
                    {i.orders.map((o, n) => (
                      <li key={n} className="flex justify-between text-mute"><span>{o.asset}</span><span className="num">{usd(o.amount_usd)}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      {manual.length > 0 ? (
        <div>
          <h2 className="mb-2 px-1 text-sm text-mute">Your buys and sales</h2>
          <Card className="divide-y divide-line p-0">
            {manual.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{o.side === "sell" ? "Sold" : "Bought"} {o.asset}</p>
                  <p className="num text-sm text-mute">{day(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="num">{usd(o.amount_usd)}</p>
                  <p className={`text-sm ${tone(o.status)}`}>{STATUS[o.status]}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      ) : null}

      {(withdrawals.data ?? []).length > 0 ? (
        <div>
          <h2 className="mb-2 px-1 text-sm text-mute">Withdrawals</h2>
          <Card className="divide-y divide-line p-0">
            {(withdrawals.data ?? []).map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{usd(w.amount_usd)} {w.asset}</p>
                  <p className="num truncate text-sm text-mute">{day(w.created_at)} · to {w.to}</p>
                </div>
                <p className={`text-sm ${tone(w.status)}`}>{STATUS[w.status]}</p>
              </div>
            ))}
          </Card>
        </div>
      ) : null}
    </Screen>
  );
}

export default function ActivityPage() {
  return (
    <RequireActive>
      <Activity />
    </RequireActive>
  );
}
