export type InstallMode = "installed" | "prompt" | "ios" | "manual";

interface Facts {
  standalone: boolean;
  ios: boolean;
  hasPrompt: boolean;
}

/** What the Install button should do on this device. */
export function installMode({ standalone, ios, hasPrompt }: Facts): InstallMode {
  if (standalone) return "installed";
  if (hasPrompt) return "prompt";
  return ios ? "ios" : "manual";
}

export function isIos(userAgent: string, maxTouchPoints = 0): boolean {
  return /iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** Accounts are made and used in the installed app or Telegram, so no second browser session exists. */
export function authAllowed({ standalone, telegram, browserOverride }: { standalone: boolean; telegram: boolean; browserOverride: boolean }): boolean {
  return standalone || telegram || browserOverride;
}
