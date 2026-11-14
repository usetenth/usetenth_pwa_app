"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { RequireActive } from "@/components/Guard";
import { Card, Chip, ErrorCard, Field, PrimaryButton, Row, Screen, SecondaryButton } from "@/components/ui";
import { fetchHoldings, fetchOrder, placeSell, sellQuote, type OrderView, type SellQuoteView } from "@/lib/api";
import { useLoad, usePoll } from "@/lib/hooks";
import { cleanName } from "@/lib/mixes";
import { usd, usdFine } from "@/lib/money";

const isQty = (v: string) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0;

function Sell() {
  const wanted = useSearchParams().get("asset") ?? "";
  const holdings = useLoad(fetchHoldings, null, true, 10_000);
  const [assetKey, setAssetKey] = useState(wanted);
  const [all, setAll] = useState(true);
  const [qty, setQty] = useState("");
  const [quote, setQuote] = useState<SellQuoteView | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selling, setSelling] = useState(false);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef("");

  const holding = holdings.data?.find((h) => h.asset_key === assetKey);
  const sale = all ? { all: true } : { qty };
  const ready = !!holding && (all || isQty(qty));

  useEffect(() => {
    if (holdings.data && !assetKey && holdings.data[0]) setAssetKey(holdings.data[0].asset_key);
  }, [holdings.data, assetKey]);

  useEffect(() => {
    setQuote(null);
    setConfirming(false);
    setError(null);
    if (!ready) return;
    let stale = false;
    setQuoting(true);
    attempt.current = crypto.randomUUID();
    const t = setTimeout(() => {
      sellQuote(assetKey, sale)
        .then((q) => !stale && setQuote(q))
        .catch((e: Error) => !stale && setError(e.message))
        .finally(() => !stale && setQuoting(false));
    }, 300);
    return () => {
      stale = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetKey, all, qty, ready]);

  const sell = useCallback(async () => {
    setSelling(true);
    setError(null);
    try {
      setOrder(await placeSell(assetKey, sale, attempt.current));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConfirming(false);
      setSelling(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetKey, all, qty]);

  const orderId = order?.id;
  const live = usePoll(orderId ? () => fetchOrder(orderId) : null, (o) => o.status !== "in_progress") ?? order;

  if (live) {
    const done = live.status !== "in_progress";
    return (
      <Screen back="/portfolio" title={live.status === "failed" ? "Sale failed" : done ? "Sale complete" : "Sale placed"} footer={<PrimaryButton href="/portfolio">See my portfolio</PrimaryButton>}>
        <Card>
          <p className="text-sm text-mute">{live.status === "completed" ? "Sold" : live.status === "failed" ? "Did not go through" : live.status === "simulated" ? "Simulated, nothing was sold" : "Submitted, still settling"}</p>
          <p className="num text-3xl font-semibold">{live.asset ?? holding?.symbol}</p>
          <p className="mt-1 text-sm text-mute">About {usd(live.amount_usd)}</p>
        </Card>
        <p className="px-1 text-sm text-mute">
          {live.status === "failed" ? "Your shares were not sold." : "The proceeds arrive as dollars in your balance. This page updates by itself."}
        </p>
      </Screen>
    );
  }

  if (holdings.data && holdings.data.length === 0) {
    return (
      <Screen back="/portfolio" title="Sell">
        <Card>
          <p className="font-medium">Nothing to sell yet.</p>
          <p className="mt-1 text-sm text-mute">Once you hold a stock, it shows up here.</p>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      back="/portfolio"
      title="Sell"
      footer={
        confirming && holding ? (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm">This sells <b>{all ? `all ${holding.available}` : qty}</b> of {cleanName(holding.name)}.</p>
            <PrimaryButton onClick={sell} disabled={selling}>{selling ? "Selling…" : "Confirm and sell"}</PrimaryButton>
            <SecondaryButton onClick={() => setConfirming(false)} disabled={selling}>Cancel</SecondaryButton>
          </div>
        ) : (
          <PrimaryButton onClick={() => setConfirming(true)} disabled={!quote || quoting}>
            {quote && holding ? `Sell ${cleanName(holding.name)}` : quoting ? "Getting a quote…" : "Sell"}
          </PrimaryButton>
        )
      }
    >
      {holdings.error ? <ErrorCard title="Couldn't load your holdings.">{holdings.error}</ErrorCard> : null}
      <Card>
        <label htmlFor="holding" className="text-sm text-mute">Stock</label>
        <select id="holding" value={assetKey} onChange={(e) => setAssetKey(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-line bg-card px-3">
          {(holdings.data ?? []).map((h) => (
            <option key={h.asset_key} value={h.asset_key}>{cleanName(h.name)} ({h.available})</option>
          ))}
        </select>
        <p className="mb-2 mt-4 text-sm text-mute">How much</p>
        <div className="flex gap-3">
          <Chip active={all} onClick={() => setAll(true)}>All</Chip>
          <Chip active={!all} onClick={() => setAll(false)}>Some</Chip>
        </div>
        {!all ? (
          <div className="mt-3">
            <Field label={`Quantity (you hold ${holding?.available ?? "…"})`} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.trim())} error={qty !== "" && !isQty(qty) ? "Enter a number, like 0.5." : null} className="num" />
          </div>
        ) : null}
      </Card>

      {quoting ? <p className="px-1 text-sm text-mute">Getting a live quote…</p> : null}

      {quote ? (
        <Card>
          <p className="text-sm text-mute">Live quote</p>
          <dl className="mt-2 space-y-2 text-sm">
            <Row label="You sell">{quote.qty}</Row>
            <Row label="Worth about">{usd(quote.estimated_usd)}</Row>
            {quote.proceeds ? <Row label="You get about">{usd(quote.proceeds)}</Row> : null}
            {quote.price ? <Row label="Price each">{usdFine(quote.price)}</Row> : null}
            {quote.fee ? <Row label="Fee">{usdFine(quote.fee)}</Row> : null}
          </dl>
        </Card>
      ) : null}

      {error ? <ErrorCard title={quote ? "That did not go through." : "Could not get a quote."}>{error}</ErrorCard> : null}
    </Screen>
  );
}

export default function SellPage() {
  return (
    <RequireActive>
      <Suspense>
        <Sell />
      </Suspense>
    </RequireActive>
  );
}
