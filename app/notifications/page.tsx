"use client";

import { useEffect } from "react";
import { RequireActive } from "@/components/Guard";
import { Card, ErrorCard, Screen } from "@/components/ui";
import { fetchNotifications, markNotificationsRead } from "@/lib/api";
import { useLoad } from "@/lib/hooks";
import { ago } from "@/lib/notify";

function Notifications() {
  const list = useLoad(fetchNotifications);
  const unread = list.data?.unread ?? 0;

  // Opening the list counts as reading it; the unread styling stays for this visit.
  useEffect(() => {
    if (unread > 0) markNotificationsRead().then(() => navigator.clearAppBadge?.()).catch(() => undefined);
  }, [unread]);

  return (
    <Screen back="/portfolio" title="Notifications">
      {list.error ? <ErrorCard onRetry={list.reload}>{list.error}</ErrorCard> : null}
      {!list.data && !list.error ? <p className="px-1 text-sm text-mute">Loading…</p> : null}
      {list.data && list.data.items.length === 0 ? (
        <Card>
          <p className="font-medium">Nothing yet</p>
          <p className="mt-1 text-sm text-mute">Every payment that reaches your wallet shows up here, whether or not anything is invested from it.</p>
        </Card>
      ) : null}
      {list.data && list.data.items.length > 0 ? (
        <Card className="divide-y divide-line p-0">
          {list.data.items.map((n) => (
            <div key={n.id} className="flex gap-3 px-4 py-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gain/15 text-gain">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{n.title}</p>
                  <p className="shrink-0 text-xs text-mute">{ago(n.created_at)}</p>
                </div>
                <p className="mt-0.5 text-sm text-mute">{n.body}</p>
              </div>
              {!n.read ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet" aria-label="Unread" /> : null}
            </div>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

export default function NotificationsPage() {
  return (
    <RequireActive>
      <Notifications />
    </RequireActive>
  );
}
