"use client";

import { useCallback, useEffect, useState } from "react";

export interface Loaded<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/** Loads on mount and whenever `key` changes; `enabled` holds it back until something it needs is ready. */
export function useLoad<T>(fetcher: (signal: AbortSignal) => Promise<T>, key: unknown = null, enabled = true): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetcher(controller.signal)
      .then((value) => !controller.signal.aborted && setData(value))
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError((e as Error).message);
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

/** Polls `fetcher` until `done` says stop (or `limitMs` passes); returns the latest value. */
export function usePoll<T>(fetcher: (() => Promise<T>) | null, done: (value: T) => boolean, intervalMs = 2000, limitMs = 180_000): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    if (!fetcher) return;
    let stopped = false;
    const started = Date.now();
    const tick = async () => {
      try {
        const next = await fetcher();
        if (stopped) return;
        setValue(next);
        if (done(next) || Date.now() - started > limitMs) return;
      } catch {}
      if (!stopped) timer = setTimeout(tick, intervalMs);
    };
    let timer = setTimeout(tick, 0);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher === null]);
  return value;
}
