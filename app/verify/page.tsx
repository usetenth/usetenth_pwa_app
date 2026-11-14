"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Guard } from "@/components/Guard";
import { Card, ErrorCard, Field, PrimaryButton, Screen, Splash } from "@/components/ui";
import { fetchKyc, fetchStage, submitKyc, type KycView } from "@/lib/api";
import { useLoad } from "@/lib/hooks";
import { routeFor } from "@/lib/stage";

const REASONS: Record<string, string> = {
  name_mismatch: "The name you gave does not match your NIN record. Check it and try again.",
  nin_not_found: "We could not find that NIN. Check the 11 digits and try again.",
  nin_rejected: "That NIN was not accepted. Check the 11 digits and try again.",
  blocked: "We cannot verify this ID. Please contact support.",
  nin_in_use: "That ID is already linked to another account.",
  rejected_in_review: "We could not verify you after a manual check. Please contact support.",
};

const isNin = (v: string) => /^\d{11}$/.test(v);

function Verify() {
  const router = useRouter();
  const stage = useLoad(fetchStage);
  const kyc = useLoad(fetchKyc);
  const [name, setName] = useState("");
  const [nin, setNin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<KycView | null>(null);

  const view = fresh ?? kyc.data;

  useEffect(() => {
    if (stage.data && stage.data !== "needs_kyc" && stage.data !== "active") router.replace(routeFor(stage.data));
  }, [stage.data, router]);

  // The check runs in the background, so wait for the answer instead of asking the user to come back.
  useEffect(() => {
    if (view?.status !== "pending" && view?.status !== "review") return;
    const timer = setInterval(() => void fetchKyc().then(setFresh).catch(() => undefined), view.status === "pending" ? 3000 : 15000);
    return () => clearInterval(timer);
  }, [view?.status]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setFresh(await submitKyc(name.trim(), nin.trim()));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!view) return kyc.error ? <Screen back="/" title="Verify your identity"><ErrorCard>{kyc.error}</ErrorCard></Screen> : <Splash />;

  if (view.status === "verified") {
    return (
      <Screen brand title="You are verified" footer={<PrimaryButton href="/portfolio">Continue</PrimaryButton>}>
        <Card>
          <p className="font-medium">Your tenth is now active.</p>
          <p className="mt-1 text-sm text-mute">Next, add funds so your first payment has somewhere to land.</p>
        </Card>
      </Screen>
    );
  }

  if (view.status === "pending" || view.status === "review") {
    return (
      <Screen brand title={view.status === "pending" ? "Checking your details" : "A closer look"}>
        <Card>
          <p className="font-medium">{view.status === "pending" ? "This usually takes a few seconds." : "Your details need a quick manual check."}</p>
          <p className="mt-1 text-sm text-mute">
            {view.status === "pending" ? "You can leave this page; we will message you when it is done." : "We will message you as soon as it is done. Nothing more is needed from you."}
          </p>
          {view.nin_masked ? <p className="num mt-3 text-sm text-mute">NIN {view.nin_masked}</p> : null}
        </Card>
      </Screen>
    );
  }

  const canSubmit = name.trim().split(/\s+/).length >= 2 && isNin(nin) && !busy;

  return (
    <Screen
      brand
      title="Verify your identity"
      subtitle="Once, about a minute"
      footer={
        <PrimaryButton onClick={submit} disabled={!canSubmit}>{busy ? "Checking…" : "Verify"}</PrimaryButton>
      }
    >
      {view.status === "failed" && view.reason ? <ErrorCard title="That did not work.">{REASONS[view.reason] ?? "We could not verify you."}</ErrorCard> : null}
      <Card>
        <p className="text-[15px]">We check your NIN with the national ID records so we know every account belongs to a real person.</p>
        <p className="mt-2 text-sm text-mute">Your NIN is stored encrypted only until the check finishes, then wiped.</p>
      </Card>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} hint="As it appears on your NIN." />
        <Field
          label="NIN"
          inputMode="numeric"
          autoComplete="off"
          maxLength={11}
          value={nin}
          onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
          error={nin !== "" && !isNin(nin) ? "A NIN is 11 digits." : null}
          className="num"
        />
        {error ? <p className="px-1 text-sm text-loss">{error}</p> : null}
        <button type="submit" className="hidden" />
      </form>
    </Screen>
  );
}

export default function VerifyPage() {
  return (
    <Guard>
      <Verify />
    </Guard>
  );
}
