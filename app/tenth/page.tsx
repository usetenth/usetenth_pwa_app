"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireActive } from "@/components/Guard";
import { Card, Chip, DotRing, ErrorCard, PrimaryButton, Screen } from "@/components/ui";
import { fetchCustomPicks, fetchPlans, fetchRule, saveRule } from "@/lib/api";
import { useLoad } from "@/lib/hooks";
import { PERCENTS, planName, planStocks, summarize } from "@/lib/mixes";

function Tenth() {
  const router = useRouter();
  const rule = useLoad(fetchRule);
  const plans = useLoad(fetchPlans);
  const picks = useLoad(fetchCustomPicks);
  const [percent, setPercent] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rule.data) setPercent(rule.data.percentage);
  }, [rule.data]);

  const plan = rule.data?.plan ?? "steady";
  const stocks = planStocks(plans.data ?? [], plan, picks.data ?? []);

  const save = async () => {
    if (!rule.data) return;
    setSaving(true);
    setError(null);
    try {
      await saveRule(percent, plan);
      router.push("/portfolio");
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <Screen back="/portfolio" title="Your tenth" footer={<PrimaryButton onClick={save} disabled={saving || !rule.data}>{saving ? "Saving…" : "Save"}</PrimaryButton>}>
      {error ? <ErrorCard title="Could not save your tenth.">{error}</ErrorCard> : null}
      {rule.error ? <ErrorCard title="Could not load your tenth.">{rule.error}</ErrorCard> : null}

      <div className="flex flex-col items-center gap-2 py-2">
        <DotRing percent={percent} />
        <p className="num text-3xl font-semibold">{percent}%</p>
        <p className="text-center text-sm text-mute">One dot in ten. Raise it whenever you like.</p>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-sm text-mute">Invest this much of every payment</h2>
        <div className="flex gap-2">
          {PERCENTS.map((p) => (
            <Chip key={p} active={percent === p} onClick={() => setPercent(p)}>{p}%</Chip>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-sm text-mute">Mix</h2>
        <Card className="flex items-center justify-between">
          <div>
            <p className="font-medium">{planName(plans.data ?? [], plan)}</p>
            <p className="text-sm text-mute">{summarize(stocks)}</p>
          </div>
          <Link href="/tenth/mix" className="font-medium text-violet">Change</Link>
        </Card>
      </div>

      {rule.data && !rule.data.enabled ? (
        <Card>
          <p className="text-sm text-mute">Your tenth switches on once your identity is verified.</p>
        </Card>
      ) : null}
    </Screen>
  );
}

export default function TenthPage() {
  return (
    <RequireActive>
      <Tenth />
    </RequireActive>
  );
}
