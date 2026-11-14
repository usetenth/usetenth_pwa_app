"use client";

import { useEffect, useState } from "react";
import { isStandalone } from "@/lib/install";

/** null until the browser has been asked; true inside the installed app. */
export function useStandalone(): boolean | null {
  const [standalone, setStandalone] = useState<boolean | null>(null);
  useEffect(() => setStandalone(isStandalone()), []);
  return standalone;
}
