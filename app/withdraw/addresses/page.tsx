"use client";

import { useEffect, useRef, useState } from "react";
import { RequireActive } from "@/components/Guard";
import { hasProof, ProofInput } from "@/components/Proof";
import { Card, ErrorCard, Field, PrimaryButton, Screen, SecondaryButton } from "@/components/ui";
import { addAddress, confirmAction, fetchAddresses, removeAddress, type ConfirmView, type Proof } from "@/lib/api";
import { useLoad } from "@/lib/hooks";

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function Addresses() {
  const addresses = useLoad(fetchAddresses);
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [method, setMethod] = useState<ConfirmView | null>(null);
  const [proof, setProof] = useState<Proof>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const edit = (fn: () => void) => {
    fn();
    setMethod(null);
    setProof({});
  };

  const start = async () => {
    autoSaved.current = false;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setMethod(await confirmAction({ action: "add_address", address: address.trim() }));
      setProof({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await addAddress(address.trim(), label.trim(), proof);
      setNotice(`Saved. It can receive withdrawals from ${when(saved.usable_at)}.`);
      setAddress("");
      setLabel("");
      setMethod(null);
      setProof({});
      addresses.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // The approval in Telegram is the confirmation, so the address is saved as soon as it arrives, once.
  const autoSaved = useRef(false);
  useEffect(() => {
    if (proof.confirmation_id && method?.method === "telegram_code" && !autoSaved.current && !busy) {
      autoSaved.current = true;
      void save();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proof.confirmation_id, method, busy]);

  const remove = async (id: string) => {
    setError(null);
    try {
      await removeAddress(id);
      addresses.reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Screen back="/withdraw" title="Withdrawal addresses" subtitle="Money can only go to an address saved here">
      {notice ? <Card><p className="text-sm">{notice}</p></Card> : null}
      {error ? <ErrorCard title="That did not work.">{error}</ErrorCard> : null}
      {addresses.error ? <ErrorCard>{addresses.error}</ErrorCard> : null}

      {(addresses.data ?? []).length > 0 ? (
        <Card className="divide-y divide-line p-0">
          {(addresses.data ?? []).map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.label ?? (a.chain_family === "solana" ? "Solana address" : "EVM address")}</p>
                <p className="num truncate text-sm text-mute">{a.address}</p>
                <p className={`text-xs ${a.usable ? "text-gain" : "text-mute"}`}>{a.usable ? "Ready to use" : `Usable from ${when(a.usable_at)}`}</p>
              </div>
              <button onClick={() => remove(a.id)} className="rounded-full border border-line px-3 py-1.5 text-sm text-loss">Remove</button>
            </div>
          ))}
        </Card>
      ) : addresses.data ? (
        <Card><p className="text-sm text-mute">You have not saved an address yet.</p></Card>
      ) : null}

      <Card className="space-y-4">
        <h2 className="font-medium">Add an address</h2>
        <p className="text-sm text-mute">Check it carefully: money sent to a wrong address cannot be recovered. A new address can be used after 24 hours.</p>
        <Field label="Wallet address" autoCapitalize="off" autoCorrect="off" spellCheck={false} value={address} onChange={(e) => edit(() => setAddress(e.target.value.trim()))} className="num text-sm" />
        <Field label="Label (optional)" maxLength={40} value={label} onChange={(e) => setLabel(e.target.value)} />
        {method ? <ProofInput method={method.method} challengeId={method.challenge_id} proof={proof} onChange={setProof} /> : null}
        {method ? (
          <>
            <PrimaryButton onClick={save} disabled={busy || !hasProof(method.method, proof)}>{busy ? "Saving…" : "Save address"}</PrimaryButton>
            {method.method === "telegram_code" ? <SecondaryButton onClick={start} disabled={busy}>Send a new code</SecondaryButton> : null}
          </>
        ) : (
          <PrimaryButton onClick={start} disabled={busy || address.length < 20}>{busy ? "Checking…" : "Continue"}</PrimaryButton>
        )}
      </Card>
    </Screen>
  );
}

export default function AddressesPage() {
  return (
    <RequireActive>
      <Addresses />
    </RequireActive>
  );
}
