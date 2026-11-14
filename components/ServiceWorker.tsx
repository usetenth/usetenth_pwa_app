"use client";

import { useEffect } from "react";

/** Registers the tiny service worker that makes the web app installable. */
export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
