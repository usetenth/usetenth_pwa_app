"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { RequireActive } from "@/components/Guard";
import { StockPicker } from "@/components/StockPicker";
import { Card, Chip, ErrorCard, Field, PrimaryButton, Row, Screen, SecondaryButton } from "@/components/ui";
import { buyQuote, fetchAssets, fetchOrder, placeBuy, type OrderView, type QuoteView } from "@/lib/api";
import { useLoad, usePoll } from "@/lib/hooks";
import { cleanName } from "@/lib/mixes";
import { isAmount, usd, usdFine } from "@/lib/money";

const PRESETS = ["5", "10", "25"];

function Buy() {
  const wanted = useSearchParams().get("asset");
  const assets = useLoad(fetchAssets);
  const [assetKey, setAssetKey] = useState("");
  const [amount, setAmount] = useState("10");
  const [quote, setQuote] = useState<QuoteView | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [buying, setBuying] = useState(false);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef("");

  const stocks = (assets.data ?? []).filter((a) => a.asset_class !== "crypto").sort((a, b) => cleanName(a.name).localeCompare(cleanName(b.name)));
  const chosen = stocks.find((s) => s.asset_key === assetKey);

  useEffect(() => {
    if (!assets.data || assetKey) return;
    const first = stocks.find((s) => s.asset_key === wanted) ?? stocks[0];
    if (first) setAssetKey(first.asset_key);
  }, [assets.data, assetKey, stocks, wanted]);

  // A fresh quote means a fresh attempt id, so an old failed attempt can never be replayed by accident.
  useEffect(() => {
    setQuote(null);
    setConfirming(false);
    setError(null);
    if (!assetKey || !isAmount(amount)) return;
    let stale = false;
    setQuoting(true);
    attempt.current = crypto.randomUUID();
    const t = setTimeout(() => {
      buyQuote(assetKey, amount)
        .then((q) => !stale && setQuote(q))
        .catch((e: Error) => !stale && setError(e.message))
        .finally(() => !stale && setQuoting(false));
    }, 300);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [assetKey, amount]);

  const buy = useCallback(async () => {
    setBuying(true);
    setError(null);
    try {
      setOrder(await placeBuy(assetKey, amount, attempt.current));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConfirming(false);
      setBuying(false);
    }
  }, [assetKey, amount]);

  const orderId = order?.id;
  const live = usePoll(orderId ? () => fetchOrder(orderId) : null, (o) => o.status !== "in_progress") ?? order;

  if (live) {
    const done = live.status !== "in_progress";
    return (
      <Screen back="/portfolio" title={live.status === "failed" ? "Order failed" : done ? "Order complete" : "Order placed"} footer={<PrimaryButton href="/portfolio">See my portfolio</PrimaryButton>}>
        <Card>
          <p className="text-sm text-mute">{live.status === "completed" ? "Bought" : live.status === "failed" ? "Did not go through" : live.status === "simulated" ? "Simulated, nothing was bought" : "Submitted, still settling"}</p>
          <p className="num text-3xl font-semibold">{usd(live.amount_usd)} of {live.asset ?? chosen?.symbol}</p>
        </Card>
        <p className="px-1 text-sm text-mute">
          {live.status === "completed" ? "It is in your portfolio now." : live.status === "failed" ? "Nothing was taken from your balance." : "True Markets has it and is still confirming the fill. This page updates by itself."}
        </p>
      </Screen>
    );
  }

  const blocked = !quote || quoting || !isAmount(amount);

  return (
    <Screen
      back="/portfolio"
      title="Buy a stock"
      footer={
        confirming ? (
          <div className="flex flex-col gap-3">
            <p className="text-center text-sm">This spends <b>{usd(amount)}</b> from your balance.</p>
            <PrimaryButton onClick={buy} disabled={buying}>{buying ? "Buying…" : "Confirm and buy"}</PrimaryButton>
            <SecondaryButton onClick={() => setConfirming(false)} disabled={buying}>Cancel</SecondaryButton>
          </div>
        ) : (
          <PrimaryButton onClick={() => setConfirming(true)} disabled={blocked}>
            {quote && chosen ? `Buy ${usd(amount)} of ${cleanName(chosen.name)}` : quoting ? "Getting a quote…" : "Buy"}
          </PrimaryButton>
        )
      }
    >
      {assets.error ? <ErrorCard title="Couldn't load the stock list.">{assets.error}</ErrorCard> : null}
      <Card>
        <p className="text-sm text-mute">Stock</p>
        <StockPicker stocks={stocks} value={assetKey} onChange={setAssetKey} />
        <p className="mb-2 mt-4 text-sm text-mute">Amount</p>
        <div className="flex gap-3">
          {PRESETS.map((a) => (
            <Chip key={a} active={amount === a} onClick={() => setAmount(a)}>{usd(a)}</Chip>
          ))}
        </div>
        <div className="mt-3">
          <Field label="Or enter an amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.trim())} error={amount !== "" && !isAmount(amount) ? "Use dollars and cents, like 12.50." : null} className="num" />
        </div>
      </Card>

      {quoting ? <p className="px-1 text-sm text-mute">Getting a live quote…</p> : null}

      {quote ? (
        <Card>
          <p className="text-sm text-mute">Live quote</p>
          <dl className="mt-2 space-y-2 text-sm">
            <Row label="You spend">{usd(quote.amount_usd)}</Row>
            {quote.qty ? <Row label="You get about">{quote.qty}</Row> : null}
            {quote.price ? <Row label="Price each">{usdFine(quote.price)}</Row> : null}
            {quote.fee ? <Row label="Fee">{usdFine(quote.fee)}</Row> : null}
          </dl>
        </Card>
      ) : null}

      {error ? <ErrorCard title={quote ? "That did not go through." : "Could not get a quote."}>{error}</ErrorCard> : null}
    </Screen>
  );
}

export default function BuyPage() {
  return (
    <RequireActive>
      <Suspense>
        <Buy />
      </Suspense>
    </RequireActive>
  );
}
