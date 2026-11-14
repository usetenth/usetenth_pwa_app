"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Guard } from "@/components/Guard";
import { Card, Chip, ErrorCard, PrimaryButton, Screen, Splash } from "@/components/ui";
import { advanceOnboarding, fetchPlans, fetchStage, saveRule, type PlanId } from "@/lib/api";
import { SAMPLE_PAYMENT } from "@/lib/config";
import { useLoad } from "@/lib/hooks";
import { PERCENTS, summarize } from "@/lib/mixes";
import { percentOf, sub, usd } from "@/lib/money";
import { routeFor } from "@/lib/stage";

function Onboarding() {
  const router = useRouter();
  const stage = useLoad(fetchStage);
  const plans = useLoad(fetchPlans);
  const [percent, setPercent] = useState(10);
  const [plan, setPlan] = useState<PlanId>("steady");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const advance = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await advanceOnboarding();
      const target = routeFor(next);
      if (target !== "/onboarding") router.replace(target);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [router]);

  useEffect(() => {
    const s = stage.data;
    if (!s || started.current) return;
    if (s === "needs_gateway") {
      started.current = true;
      void advance();
    } else if (s !== "needs_rule") {
      router.replace(routeFor(s));
    }
  }, [stage.data, advance, router]);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveRule(percent, plan);
      await advance();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  if (stage.loading || !stage.data) return stage.error ? <Screen title="usetenth"><ErrorCard>{stage.error}</ErrorCard></Screen> : <Splash />;

  if (stage.data === "needs_gateway") {
    return (
      <Screen brand title="Setting up your account" footer={error ? <PrimaryButton onClick={advance} disabled={busy}>Try again</PrimaryButton> : undefined}>
        {error ? <ErrorCard title="We could not finish setting up your account.">{error}</ErrorCard> : <p className="px-1 pt-2 text-sm text-mute">Creating your wallet. This takes a few seconds.</p>}
      </Screen>
    );
  }

  const invested = percentOf(SAMPLE_PAYMENT, percent);

  return (
    <Screen
      brand
      title="usetenth"
      subtitle="Setting you up"
      footer={
        <>
          <PrimaryButton onClick={start} disabled={busy}>{busy ? "Saving…" : "Continue"}</PrimaryButton>
          {error ? <p className="mt-3 text-center text-sm text-loss">{error}</p> : null}
          <p className="mt-3 text-center text-sm text-mute">Next: your wallet, then a quick identity check.</p>
        </>
      }
    >
      <Card>
        <p className="text-[15px]">Two questions and you&apos;re set. You can change both later.</p>
      </Card>

      <Card>
        <h2 className="mb-3 text-[15px] font-medium">How much of each payment should I invest?</h2>
        <div className="flex gap-3">
          {PERCENTS.map((p) => (
            <Chip key={p} active={percent === p} onClick={() => setPercent(p)}>{p}%</Chip>
          ))}
        </div>
        <p className="mt-3 text-sm text-mute">
          On a {usd(SAMPLE_PAYMENT)} payment that is {usd(invested)} invested, {usd(sub(SAMPLE_PAYMENT, invested))} left for you.
        </p>
      </Card>

      <div>
        <h2 className="mb-3 px-1 text-[15px] font-medium">Pick your mix.</h2>
        {plans.error ? <ErrorCard title="Could not load the mixes.">{plans.error}</ErrorCard> : null}
        <div className="flex flex-col gap-3">
          {(plans.data ?? []).map((m) => {
            const on = plan === m.plan;
            return (
              <button
                key={m.plan}
                onClick={() => setPlan(m.plan)}
                aria-pressed={on}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${on ? "border-violet bg-violet/10" : "border-line bg-card/90"}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-violet" : "border-mute/60"}`}>
                  {on ? <span className="h-3 w-3 rounded-full bg-violet" /> : null}
                </span>
                <span>
                  <span className="block font-medium">{m.name}</span>
                  <span className="block text-sm text-mute">{m.blurb}</span>
                  <span className="mt-1 block text-xs text-mute">{summarize(m.stocks)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

export default function OnboardingPage() {
  return (
    <Guard>
      <Onboarding />
    </Guard>
  );
}
