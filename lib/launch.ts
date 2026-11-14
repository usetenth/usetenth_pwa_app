"use client";

import { useEffect, useSyncExternalStore } from "react";

let released = false;
const listeners = new Set<() => void>();

/** Called by the first real screen, so the launch splash hands over without a second loading state. */
export function releaseLaunch() {
  if (released) return;
  released = true;
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useLaunchReleased = () => useSyncExternalStore(subscribe, () => released, () => false);

/** Put in any screen that shows real content. */
export function useReleaseLaunch() {
  useEffect(() => releaseLaunch(), []);
}
