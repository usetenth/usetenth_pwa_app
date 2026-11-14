"use client";

import { useEffect, useState } from "react";
import { RequireActive } from "@/components/Guard";
import { AddressQr, ICONS, Icon, ShareSheet } from "@/components/WalletShare";
import { Card, Chip, ErrorCard, Screen } from "@/components/ui";
import { fetchDeposit } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { useLoad } from "@/lib/hooks";
import { networkName } from "@/lib/networks";

/** "USDC, PYUSD": what this network takes, falling back to the main asset. */
const accepted = (assets: string[], fallback: string) => (assets.length > 0 ? assets.join(", ") : fallback);

function AddFunds() {
  const deposit = useLoad(fetchDeposit);
  const [selected, setSelected] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!deposit.data) return;
    const wanted = new URLSearchParams(window.location.search).get("network");
    setSelected(deposit.data.networks.find((n) => n.network === wanted)?.network ?? deposit.data.default_network);
  }, [deposit.data]);

  const data = deposit.data;
  const current = data?.networks.find((n) => n.network === selected) ?? null;

  const copy = async () => {
    if (!current || !(await copyText(current.address))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Screen back="/portfolio" title="Your wallet">
      {deposit.error ? <ErrorCard>{deposit.error}</ErrorCard> : null}
      {!data && !deposit.error ? <p className="px-1 text-sm text-mute">Loading your wallet…</p> : null}

      {data ? (
        <>
          <p className="px-1 text-sm text-mute">Share this address with whoever pays you. We keep your tenth and invest it as each payment lands.</p>

          <div className="flex flex-wrap gap-2">
            {data.networks.map((n) => (
              <Chip key={n.network} active={selected === n.network} onClick={() => setSelected(n.network)} className="!flex-none px-5">
                {networkName(n.network)}
              </Chip>
            ))}
          </div>

          {current ? (
            <Card className="flex flex-col items-center text-center">
              <AddressQr value={current.address} size={180} />
              <p className="mt-4 rounded-full bg-violet/10 px-3 py-1 text-xs font-medium text-violet">{accepted(current.assets, data.asset)} on {networkName(current.network)}</p>
              <p className="num mt-3 break-all text-sm">{current.address}</p>
              <div className="mt-4 grid w-full grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={copy}
                  className="flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-card text-sm font-semibold transition active:scale-[0.98]"
                >
                  <Icon d={copied ? ICONS.check : ICONS.copy} className="h-4 w-4" />
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => setSharing(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-violet text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(91,61,245,0.7)] transition active:scale-[0.98]"
                >
                  <Icon d={ICONS.share} className="h-4 w-4" />
                  Share
                </button>
              </div>
            </Card>
          ) : null}

          {current ? (
            <p className="rounded-2xl border border-loss/40 p-3 text-sm">
              Only send stablecoins ({accepted(current.assets, data.asset)}) on {networkName(current.network)}. Any other asset or network can be lost for good.
            </p>
          ) : null}

          <p className="px-1 text-sm text-mute">You will see each payment under Activity, and get a message in Telegram if you have connected it.</p>

          {current ? <ShareSheet open={sharing} onClose={() => setSharing(false)} asset={accepted(current.assets, data.asset)} network={networkName(current.network)} address={current.address} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

export default function AddFundsPage() {
  return (
    <RequireActive>
      <AddFunds />
    </RequireActive>
  );
}
