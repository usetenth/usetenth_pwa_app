"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RequireActive } from "@/components/Guard";
import { hasProof, ProofInput } from "@/components/Proof";
import { TokenPicker, type TokenOption } from "@/components/TokenPicker";
import { Card, ErrorCard, Field, PrimaryButton, Row, Screen, SecondaryButton } from "@/components/ui";
import {
  confirmAction,
  fetchAddresses,
  fetchPortfolio,
  fetchWithdrawAssets,
  fetchWithdrawal,
  withdraw,
  type ConfirmView,
  type Proof,
  type WithdrawalView,
} from "@/lib/api";
import { useLoad, usePoll } from "@/lib/hooks";
import { chainName } from "@/lib/networks";
import { fromCents, gt, isAmount, toCents, usd } from "@/lib/money";

const DRAFT = "usetenth:withdraw-draft";
const DRAFT_MAX_AGE_MS = 10 * 60_000;

const short = (a: string) => (a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a);

function Withdraw() {
  const portfolio = useLoad(fetchPortfolio, null, true, 10_000);
  const addresses = useLoad(fetchAddresses);
  const assets = useLoad(fetchWithdrawAssets, null, true, 10_000);
  const [addressId, setAddressId] = useState("");
  const [assetKey, setAssetKey] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<ConfirmView | null>(null);
  const [proof, setProof] = useState<Proof>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState<WithdrawalView | null>(null);
  const attempt = useRef("");

  const cash = portfolio.data?.cash ?? "0.00";
  const usable = (addresses.data ?? []).filter((a) => a.usable);
  const address = usable.find((a) => a.id === addressId);
  // Every stablecoin the user holds, with the reason when one cannot go to the chosen address.
  const choices: TokenOption[] = [...(assets.data ?? [])]
    .map((a) => ({
      ...a,
      blocked: !a.withdrawable
        ? "Cannot be withdrawn from here"
        : address && a.chain_family !== "any" && a.chain_family !== address.chain_family
          ? "Not for this kind of address"
          : undefined,
    }))
    .sort((x, y) => Number(!!x.blocked) - Number(!!y.blocked) || Number.parseFloat(y.available ?? "0") - Number.parseFloat(x.available ?? "0") || x.symbol.localeCompare(y.symbol));
  const asset = choices.find((a) => a.asset_key === assetKey && !a.blocked) ?? choices.find((a) => !a.blocked);
  const max = asset?.available != null ? fromCents(toCents(asset.available)) : cash;
  const amountOk = isAmount(amount) && !gt(amount, max);
  const canStart = !!address && !!asset && amountOk && !busy;

  // Going to Telegram to approve can reload this page, so the request in progress is kept for a few minutes.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT);
      if (!raw) return;
      const d = JSON.parse(raw) as { at: number; addressId: string; assetKey?: string; amount: string; attempt: string; method: ConfirmView };
      if (Date.now() - d.at > DRAFT_MAX_AGE_MS) return sessionStorage.removeItem(DRAFT);
      setAddressId(d.addressId);
      setAssetKey(d.assetKey ?? "");
      setAmount(d.amount);
      attempt.current = d.attempt;
      setMethod(d.method);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (method && addressId && !queued) sessionStorage.setItem(DRAFT, JSON.stringify({ at: Date.now(), addressId, assetKey: asset?.asset_key ?? "", amount, attempt: attempt.current, method }));
      else sessionStorage.removeItem(DRAFT);
    } catch {}
  }, [method, addressId, amount, queued, asset?.asset_key]);

  useEffect(() => {
    if (!addressId && usable[0]) setAddressId(usable[0].id);
  }, [addressId, usable]);

  // Any change to what is being withdrawn is a different request, so it needs its own confirmation.
  const edit = (fn: () => void) => {
    fn();
    setMethod(null);
    setProof({});
    setError(null);
    autoSent.current = false;
  };

  const start = async () => {
    if (!address || !asset) return;
    attempt.current = crypto.randomUUID();
    autoSent.current = false;
    setBusy(true);
    setError(null);
    try {
      setMethod(await confirmAction({ action: "withdraw", address_id: address.id, asset_key: asset.asset_key, amount_usd: amount, client_ref: attempt.current }));
      setProof({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!address || !asset) return;
    setBusy(true);
    setError(null);
    try {
      setQueued(await withdraw({ address_id: address.id, asset_key: asset.asset_key, amount_usd: amount, client_ref: attempt.current }, proof));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  // The approval in Telegram is the confirmation, so the withdrawal goes out as soon as it arrives, once.
  const autoSent = useRef(false);
  useEffect(() => {
    if (proof.confirmation_id && method?.method === "telegram_code" && !autoSent.current && !busy && !queued) {
      autoSent.current = true;
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proof.confirmation_id, method, busy, queued]);

  const queuedId = queued?.id;
  const live = usePoll(queuedId ? () => fetchWithdrawal(queuedId) : null, (w) => w.status !== "in_progress") ?? queued;

  if (live) {
    const done = live.status !== "in_progress";
    return (
      <Screen back="/portfolio" title={live.status === "failed" ? "Withdrawal failed" : done ? "Withdrawal sent" : "Withdrawal queued"} footer={<PrimaryButton href="/portfolio">Back to portfolio</PrimaryButton>}>
        <Card>
          <p className="text-sm text-mute">{live.status === "completed" ? "Sent" : live.status === "failed" ? "Did not go through" : live.status === "simulated" ? "Simulated, nothing was sent" : "On its way"}</p>
          <p className="num text-3xl font-semibold">{usd(live.amount_usd)} {live.asset ?? ""}</p>
          <p className="num mt-2 break-all text-sm text-mute">To {live.to}</p>
        </Card>
        <p className="px-1 text-sm text-mute">
          {live.status === "failed" ? "Nothing left your account." : "Transfers are final once the network confirms them. This page updates by itself."}
        </p>
      </Screen>
    );
  }

  const noAddress = addresses.data !== null && addresses.data.length === 0;
  const waiting = addresses.data !== null && addresses.data.length > 0 && usable.length === 0;

  return (
    <Screen
      back="/portfolio"
      title="Withdraw"
      footer={
        method ? (
          <div className="flex flex-col gap-3">
            <PrimaryButton onClick={submit} disabled={busy || !hasProof(method.method, proof)}>{busy ? "Sending…" : `Withdraw ${usd(amount)}`}</PrimaryButton>
            <SecondaryButton onClick={start} disabled={busy}>{method.method === "telegram_code" ? "Send a new code" : "Start over"}</SecondaryButton>
          </div>
        ) : (
          <PrimaryButton onClick={start} disabled={!canStart}>{busy ? "Checking…" : `Continue ${amountOk ? usd(amount) : ""}`}</PrimaryButton>
        )
      }
    >
      <div className="px-1">
        <p className="text-sm text-mute">Ready to withdraw now</p>
        <p className="num text-5xl font-semibold tracking-tight">{usd(cash)}</p>
        <p className="mt-2 text-sm text-mute">This is the part of your payments that was never invested. Nothing has to be sold.</p>
      </div>

      {addresses.error ? <ErrorCard>{addresses.error}</ErrorCard> : null}

      {noAddress ? (
        <Card>
          <p className="font-medium">Add where to send your money.</p>
          <p className="mt-1 text-sm text-mute">New addresses can be used after a 24-hour wait, so nobody can add one and empty your account in one go.</p>
          <PrimaryButton href="/withdraw/addresses" className="mt-3 h-12 text-sm">Add an address</PrimaryButton>
        </Card>
      ) : waiting ? (
        <Card>
          <p className="font-medium">Your address is not ready yet.</p>
          <p className="mt-1 text-sm text-mute">New addresses can be used after a 24-hour wait. <Link href="/withdraw/addresses" className="font-medium text-violet">See your addresses</Link></p>
        </Card>
      ) : (
        <>
          <div>
            <label htmlFor="amount" className="mb-2 block px-1 text-sm">Amount</label>
            <div className="flex items-center rounded-2xl border border-line bg-card px-4">
              <span className="num text-lg text-mute">$</span>
              <input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => edit(() => setAmount(e.target.value.trim()))}
                aria-invalid={amount !== "" && !amountOk}
                className="num h-14 flex-1 bg-transparent pl-1 text-lg outline-none"
              />
            </div>
            {amount !== "" && !amountOk ? <p className="mt-1 px-1 text-sm text-loss">Enter an amount up to {usd(max)}.</p> : null}
            <button onClick={() => edit(() => setAmount(max))} className="mt-2 rounded-full bg-chip px-4 py-2 text-sm">Withdraw all</button>
          </div>

          <div>
            <p className="mb-2 px-1 text-sm">Withdraw from</p>
            <TokenPicker options={choices} value={asset?.asset_key ?? ""} onChange={(key) => edit(() => setAssetKey(key))} />
          </div>

          <div>
            <label htmlFor="to" className="mb-2 block px-1 text-sm">Send to</label>
            <select id="to" value={addressId} onChange={(e) => edit(() => setAddressId(e.target.value))} className="h-14 w-full rounded-2xl border border-line bg-card px-4">
              {usable.map((a) => (
                <option key={a.id} value={a.id}>{a.label ? `${a.label} · ` : ""}{short(a.address)}</option>
              ))}
            </select>
            {address && asset ? (
              <p className="mt-2 px-1 text-sm text-mute">{asset.symbol} on {chainName(asset.chain, address.chain_family)}. Sending to another network will lose the funds.</p>
            ) : address ? (
              <p className="mt-2 px-1 text-sm text-loss">None of the tokens you hold can be sent to this kind of address.</p>
            ) : null}
            <Link href="/withdraw/addresses" className="mt-2 inline-block px-1 text-sm font-medium text-violet">Manage addresses</Link>
          </div>

          {method && address ? (
            <Card className="space-y-4">
              <dl className="space-y-2 text-sm">
                <Row label="Amount">{usd(amount)}</Row>
                <Row label="To">{short(address.address)}</Row>
              </dl>
              <ProofInput method={method.method} challengeId={method.challenge_id} proof={proof} onChange={setProof} />
            </Card>
          ) : null}
        </>
      )}

      {error ? <ErrorCard title="That did not go through.">{error}</ErrorCard> : null}
    </Screen>
  );
}

export default function WithdrawPage() {
  return (
    <RequireActive>
      <Withdraw />
    </RequireActive>
  );
}
