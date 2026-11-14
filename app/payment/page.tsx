"use client";

import { RequireActive } from "@/components/Guard";
import { Card, PrimaryButton, Screen, SecondaryButton } from "@/components/ui";
import { fetchCustomPicks, fetchPlans, fetchRule } from "@/lib/api";
import { SAMPLE_PAYMENT } from "@/lib/config";
import { useLoad } from "@/lib/hooks";
import { cleanName, planName, planStocks } from "@/lib/mixes";
import { percentOf, splitByBps, sub, usd } from "@/lib/money";

function Payment() {
  const rule = useLoad(fetchRule);
  const plans = useLoad(fetchPlans);
  const picks = useLoad(fetchCustomPicks);

  const percent = rule.data?.percentage ?? 10;
  const plan = rule.data?.plan ?? "steady";
  const stocks = planStocks(plans.data ?? [], plan, picks.data ?? []);
  const invested = percentOf(SAMPLE_PAYMENT, percent);
  const fills = splitByBps(invested, stocks.map((s) => s.weight_bps));

  return (
    <Screen
      back="/portfolio"
      brand
      title="usetenth"
      subtitle="Example payment"
      footer={
        <div className="flex flex-col gap-3">
          <PrimaryButton href="/portfolio">See my portfolio</PrimaryButton>
          <SecondaryButton href="/tenth">Change my tenth</SecondaryButton>
        </div>
      }
    >
      <Card>
        <p className="text-sm text-mute">Payment received</p>
        <p className="num text-4xl font-semibold">{usd(SAMPLE_PAYMENT)}</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-violet" style={{ width: `${percent}%` }} />
        </div>
        <ul className="mt-3 space-y-1 text-[15px]">
          <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet" />{usd(invested)} invested</li>
          <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-mute/50" />{usd(sub(SAMPLE_PAYMENT, invested))} ready to withdraw</li>
        </ul>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm text-mute">Your {planName(plans.data ?? [], plan)} mix, filled</h2>
        {stocks.length === 0 ? (
          <p className="text-sm text-mute">Pick a mix to see how a payment would be split.</p>
        ) : (
          <ul className="divide-y divide-line">
            {stocks.map((s, i) => (
              <li key={s.asset_key} className="flex justify-between py-2.5">
                <span>{cleanName(s.name)}</span>
                <span className="num">{usd(fills[i] ?? "0.00")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="px-1 text-sm text-mute">An example only. Real payments are split the same way, and every order shows its fee and price.</p>
    </Screen>
  );
}

export default function PaymentPage() {
  return (
    <RequireActive>
      <Payment />
    </RequireActive>
  );
}
